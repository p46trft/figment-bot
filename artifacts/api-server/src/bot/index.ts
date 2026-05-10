import {
  Client,
  EmbedBuilder,
  GatewayIntentBits,
  Events,
  type Message,
  Partials,
} from "discord.js";
import { createGeminiClient } from "./gemini";
import { commands } from "./commands";
import { logger } from "../lib/logger";

function isAuthorized(message: Message): boolean {
  const botOwnerId = process.env["BOT_OWNER_ID"];
  const requiredRole = process.env["REQUIRED_ROLE"]?.trim().toLowerCase();

  // If no role restriction is configured, allow everyone
  if (!requiredRole) return true;

  const userId = message.author.id;

  // Bot owner always passes
  if (botOwnerId && userId === botOwnerId) return true;

  // Outside of a guild (DMs) — only bot owner allowed when role restriction is active
  if (!message.guild || !message.member) return false;

  // Server owner always passes
  if (userId === message.guild.ownerId) return true;

  // Check if the member has the required role (match by name or ID, case-insensitive)
  return message.member.roles.cache.some(
    (r) => r.name.toLowerCase() === requiredRole || r.id === requiredRole
  );
}

export function startBot(): void {
  const token = process.env["DISCORD_BOT_TOKEN"];
  if (!token) {
    logger.error("DISCORD_BOT_TOKEN is not set — bot will not start");
    return;
  }

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
    logger.info({ tag: readyClient.user.tag, guilds, guildCount: guilds.length }, "Discord bot logged in");
  });

  client.on(Events.GuildCreate, (guild) => {
    logger.info({ guildId: guild.id, guildName: guild.name }, "Bot added to new server");
  });

  client.on(Events.GuildDelete, (guild) => {
    logger.info({ guildId: guild.id, guildName: guild.name }, "Bot removed from server");
  });

  client.on(Events.MessageCreate, async (message: Message) => {
    if (message.author.bot) return;

    const content = message.content.trimStart();
    if (!content.startsWith("?")) return;

    const withoutPrefix = content.slice(1);
    const spaceIdx = withoutPrefix.search(/\s/);
    const commandName = (spaceIdx === -1 ? withoutPrefix : withoutPrefix.slice(0, spaceIdx)).toLowerCase();
    const args = spaceIdx === -1 ? "" : withoutPrefix.slice(spaceIdx + 1).trim();

    const handler = commands.get(commandName);
    if (!handler) return;

    // Role authorization check
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
    logger.info({ guildName, user: message.author.username, command: commandName }, "Command received");

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
