import { EmbedBuilder } from "discord.js";
import { truncate } from "../gemini";
import type { CommandHandler } from "../types";

function embed(description: string) {
  return new EmbedBuilder().setDescription(truncate(description));
}

function canSend(channel: unknown): channel is { send: Function; react?: Function } {
  return typeof channel === "object" && channel !== null && "send" in channel;
}

const LETTER_EMOJIS = ["🇦", "🇧", "🇨", "🇩", "🇪"];

export const poll: CommandHandler = async ({ message, args }) => {
  if (!args) {
    await message.reply({ embeds: [embed("❌ Usage: `?poll [question] | [option1] | [option2] ...`")] });
    return;
  }

  if (!canSend(message.channel)) return;

  const parts = args.split("|").map((s) => s.trim());
  const question = parts[0];
  const options = parts.slice(1);

  let description: string;
  let reactions: string[];

  if (options.length >= 2) {
    const optionLines = options
      .slice(0, 5)
      .map((opt, i) => `${LETTER_EMOJIS[i]} ${opt}`)
      .join("\n");
    description = `📊 **${question}**\n\n${optionLines}`;
    reactions = LETTER_EMOJIS.slice(0, Math.min(options.length, 5));
  } else {
    description = `📊 **${question}**\n\n✅ Yes  ·  ❌ No`;
    reactions = ["✅", "❌"];
  }

  const sent = await message.channel.send({ embeds: [embed(description)] });
  for (const emoji of reactions) {
    await sent.react(emoji);
  }
};

export const announce: CommandHandler = async ({ message, args }) => {
  if (!args) {
    await message.reply({ embeds: [embed("❌ Usage: `?announce [message]`")] });
    return;
  }
  if (!canSend(message.channel)) return;
  await message.channel.send({
    embeds: [embed(`📢 **Announcement**\n\n${args}`)],
  });
};

export const welcome: CommandHandler = async ({ message, args, quotedAuthor }) => {
  const name = quotedAuthor ?? (args || message.author.username);
  if (!canSend(message.channel)) return;
  await message.channel.send({
    embeds: [embed(`👋 Welcome to the server, **${name}**!\nGlad to have you here. Check the rules and make yourself at home.`)],
  });
};

export const goodbye: CommandHandler = async ({ message, args, quotedAuthor }) => {
  const name = quotedAuthor ?? (args || message.author.username);
  if (!canSend(message.channel)) return;
  await message.channel.send({
    embeds: [embed(`👋 **${name}** has left the server. Farewell.`)],
  });
};

export const warn: CommandHandler = async ({ message, args, quotedAuthor }) => {
  const target = quotedAuthor ?? "User";
  const reason = args || "No reason provided.";
  await message.reply({
    embeds: [embed(`⚠️ **Warning**\n**User:** ${target}\n**Reason:** ${reason}`)],
    allowedMentions: { repliedUser: true },
  });
};

export const rules: CommandHandler = async ({ message }) => {
  await message.reply({
    embeds: [embed(
      "📜 **Server Rules**\n\n" +
      "1. Be respectful to all members.\n" +
      "2. No spam or self-promotion.\n" +
      "3. No NSFW content outside designated channels.\n" +
      "4. Follow Discord's Terms of Service.\n" +
      "5. Listen to the moderators.\n\n" +
      "*Violations may result in warnings, mutes, or bans.*"
    )],
  });
};

export const report: CommandHandler = async ({ message, args, quotedAuthor, quotedText }) => {
  const target = quotedAuthor ?? "Unknown";
  const reason = args || "No reason provided.";
  const context = quotedText ? `\n**Message:** "${quotedText}"` : "";
  await message.reply({
    embeds: [embed(`🚨 **Report Filed**\n**Reported user:** ${target}\n**Reason:** ${reason}${context}\n**Reported by:** ${message.author.username}`)],
    allowedMentions: { repliedUser: false },
  });
};

export const suggest: CommandHandler = async ({ message, args }) => {
  if (!args) {
    await message.reply({ embeds: [embed("❌ Usage: `?suggest [your idea]`")] });
    return;
  }
  if (!canSend(message.channel)) return;
  const sent = await message.channel.send({
    embeds: [embed(`💡 **Suggestion**\n\n${args}\n\n*Submitted by ${message.author.username}*`)],
  });
  await sent.react("👍");
  await sent.react("👎");
};
