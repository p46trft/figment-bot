import {
  Client,
  EmbedBuilder,
  GatewayIntentBits,
  Events,
  type Message,
  Partials,
} from "discord.js";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createGeminiClient } from "./gemini";
import { commands } from "./commands";
import { logger } from "../lib/logger";

// ─── Singleton lock ────────────────────────────────────────────────────────────
// Prevents multiple bot instances from running on the same machine at once.
// Uses a PID lock file; stale locks from dead processes are automatically cleared.
const LOCK_FILE = path.join(os.tmpdir(), "figment-bot.lock");

function acquireLock(): boolean {
  try {
    if (fs.existsSync(LOCK_FILE)) {
      const existingPid = Number(fs.readFileSync(LOCK_FILE, "utf-8").trim());
      // Check whether the process that wrote the lock is still alive
      try {
        process.kill(existingPid, 0); // signal 0 = existence check, no actual signal
        // Process is alive → another instance is running on this machine
        logger.warn(
          { existingPid, ourPid: process.pid },
          "Another bot instance is already running on this machine — exiting to avoid duplicate responses"
        );
        return false;
      } catch {
        // Process is dead → stale lock, safe to take over
        logger.info({ stalePid: existingPid }, "Clearing stale lock file from previous process");
      }
    }
    fs.writeFileSync(LOCK_FILE, String(process.pid), "utf-8");
    return true;
  } catch (err) {
    // Lock file I/O failed (e.g. read-only FS on some platforms) — allow startup
    logger.warn({ err }, "Could not manage lock file; proceeding anyway");
    return true;
  }
}

function releaseLock(): void {
  try {
    if (fs.existsSync(LOCK_FILE)) {
      const pid = Number(fs.readFileSync(LOCK_FILE, "utf-8").trim());
      if (pid === process.pid) fs.unlinkSync(LOCK_FILE);
    }
  } catch {
    // Best-effort cleanup
  }
}

// ─── Deduplication guard ────────────────────────────────────────────────────
// Catches any duplicate MessageCreate events from the same process
// (e.g. discord.js partial-channel re-emits during reconnects).
const processedIds = new Set<string>();
const MAX_PROCESSED = 5000;

function markProcessed(id: string): boolean {
  if (processedIds.has(id)) return false;
  if (processedIds.size >= MAX_PROCESSED) {
    const first = processedIds.values().next().value;
    if (first !== undefined) processedIds.delete(first);
  }
  processedIds.add(id);
  return true;
}

// ─── Role authorization ──────────────────────────────────────────────────────
function isAuthorized(message: Message): boolean {
  const botOwnerId = process.env["BOT_OWNER_ID"];
  const requiredRole = process.env["REQUIRED_ROLE"]?.trim().toLowerCase();

  if (!requiredRole) return true;

  const userId = message.author.id;
  if (botOwnerId && userId === botOwnerId) return true;
  if (!message.guild || !message.member) return false;
  if (userId === message.guild.ownerId) return true;

  return message.member.roles.cache.some(
    (r) => r.name.toLowerCase() === requiredRole || r.id === requiredRole
  );
}

// ─── Bot entrypoint ──────────────────────────────────────────────────────────
export function startBot(): void {
  const token = process.env["DISCORD_BOT_TOKEN"];
  if (!token) {
    logger.error("DISCORD_BOT_TOKEN is not set — bot will not start");
    return;
  }

  // Enforce single instance on this machine
  if (!acquireLock()) {
    logger.error(
      "Bot startup aborted — another instance is already running. " +
      "Stop the other process (check Render, Replit, or any other hosting) before starting again."
    );
    process.exit(1);
  }

  // Release lock on clean exit
  for (const sig of ["exit", "SIGINT", "SIGTERM", "SIGQUIT"] as const) {
    process.on(sig, () => {
      releaseLock();
    });
  }

  const instanceId = `${os.hostname()}-${process.pid}`;
  logger.info({ instanceId }, "Bot instance starting");

  const ai = createGeminiClient();
  const startTime = Date.now();

  const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.MessageContent,
      GatewayIntentBits.DirectMessages,
    ],
    partials: [Partials.Channel],
  });

  client.once(Events.ClientReady, (readyClient) => {
    const guilds = readyClient.guilds.cache.map((g) => g.name);
    logger.info(
      { instanceId, tag: readyClient.user.tag, guilds, guildCount: guilds.length },
      "Discord bot logged in"
    );
  });

  client.on(Events.GuildCreate, (guild) => {
    logger.info({ instanceId, guildId: guild.id, guildName: guild.name }, "Bot added to new server");
  });

  client.on(Events.GuildDelete, (guild) => {
    logger.info({ instanceId, guildId: guild.id, guildName: guild.name }, "Bot removed from server");
  });

  client.on(Events.MessageCreate, async (message: Message) => {
    if (message.author.bot) return;

    const content = message.content.trimStart();
    if (!content.startsWith("?")) return;

    const withoutPrefix = content.slice(1);
    const spaceIdx = withoutPrefix.search(/\s/);
    const commandName = (
      spaceIdx === -1 ? withoutPrefix : withoutPrefix.slice(0, spaceIdx)
    ).toLowerCase();
    const args = spaceIdx === -1 ? "" : withoutPrefix.slice(spaceIdx + 1).trim();

    const handler = commands.get(commandName);
    if (!handler) return;

    // Deduplicate within this process
    if (!markProcessed(message.id)) return;

    // Role authorization
    if (!isAuthorized(message)) {
      await message.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(0xff0000)
            .setDescription("You don't have the required role to use this bot."),
        ],
      });
      return;
    }

    const guildName = message.guild?.name ?? "DM";
    logger.info(
      { instanceId, guildName, user: message.author.username, command: commandName },
      "Command received"
    );

    if ("sendTyping" in message.channel) {
      await message.channel.sendTyping();
    }

    let quotedAuthor: string | null = null;
    let quotedText: string | null = null;
    let replyTarget: Message = message;

    if (message.reference?.messageId) {
      try {
        const referenced = await message.fetchReference();
        quotedAuthor = referenced.author.username;
        quotedText = referenced.content || null;
        replyTarget = referenced;
      } catch (err) {
        logger.warn({ err }, "Could not fetch referenced message");
      }
    }

    try {
      await handler({ message, args, ai, client, startTime, quotedAuthor, quotedText, replyTarget });
    } catch (err) {
      logger.error({ err, command: commandName }, "Command failed");
      await message.reply({
        embeds: [new EmbedBuilder().setDescription("❌ Something went wrong. Try again.")],
      });
    }
  });

  client.login(token).catch((err) => {
    logger.error({ err }, "Failed to log in to Discord");
  });
}
