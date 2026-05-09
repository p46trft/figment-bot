import { EmbedBuilder } from "discord.js";
import { truncate } from "../gemini";
import type { CommandHandler } from "../types";

function embed(description: string) {
  return new EmbedBuilder().setDescription(truncate(description));
}

function formatUptime(ms: number): string {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const h = Math.floor(m / 60);
  const d = Math.floor(h / 24);
  if (d > 0) return `${d}d ${h % 24}h ${m % 60}m`;
  if (h > 0) return `${h}h ${m % 60}m ${s % 60}s`;
  if (m > 0) return `${m}m ${s % 60}s`;
  return `${s}s`;
}

export const ping: CommandHandler = async ({ message, client }) => {
  const sent = await message.reply({ embeds: [embed("🏓 Pinging...")] });
  const latency = sent.createdTimestamp - message.createdTimestamp;
  const wsLatency = client.ws.ping;
  await sent.edit({
    embeds: [embed(`🏓 Pong!\n**Round-trip:** ${latency}ms\n**WebSocket:** ${wsLatency}ms`)],
  });
};

export const uptime: CommandHandler = async ({ message, startTime }) => {
  const ms = Date.now() - startTime;
  await message.reply({ embeds: [embed(`⏱️ Uptime: **${formatUptime(ms)}**`)] });
};

export const serverinfo: CommandHandler = async ({ message }) => {
  const guild = message.guild;
  if (!guild) {
    await message.reply({ embeds: [embed("❌ This command only works in a server.")] });
    return;
  }

  await guild.fetch();
  const owner = await guild.fetchOwner();
  const created = `<t:${Math.floor(guild.createdTimestamp / 1000)}:D>`;

  const info = [
    `**Server:** ${guild.name}`,
    `**ID:** ${guild.id}`,
    `**Owner:** ${owner.user.username}`,
    `**Members:** ${guild.memberCount}`,
    `**Channels:** ${guild.channels.cache.size}`,
    `**Roles:** ${guild.roles.cache.size}`,
    `**Created:** ${created}`,
  ].join("\n");

  await message.reply({ embeds: [embed(info)] });
};

export const userinfo: CommandHandler = async ({ message, quotedAuthor }) => {
  const guild = message.guild;
  if (!guild) {
    await message.reply({ embeds: [embed("❌ This command only works in a server.")] });
    return;
  }

  let target = message.mentions.members?.first();

  if (!target && message.reference?.messageId) {
    try {
      const ref = await message.fetchReference();
      target = await guild.members.fetch(ref.author.id);
    } catch {}
  }

  if (!target) {
    target = await guild.members.fetch(message.author.id);
  }

  const user = target.user;
  const joined = target.joinedTimestamp
    ? `<t:${Math.floor(target.joinedTimestamp / 1000)}:D>`
    : "Unknown";
  const created = `<t:${Math.floor(user.createdTimestamp / 1000)}:D>`;
  const roles = target.roles.cache
    .filter((r) => r.name !== "@everyone")
    .map((r) => r.name)
    .join(", ") || "None";

  const info = [
    `**User:** ${user.username}`,
    `**ID:** ${user.id}`,
    `**Joined server:** ${joined}`,
    `**Account created:** ${created}`,
    `**Roles:** ${roles}`,
  ].join("\n");

  await message.reply({ embeds: [embed(info)] });
};
