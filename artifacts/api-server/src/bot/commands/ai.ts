import { EmbedBuilder } from "discord.js";
import { generateAI, truncate } from "../gemini";
import type { CommandHandler } from "../types";

function embed(description: string) {
  return new EmbedBuilder().setDescription(truncate(description));
}

function targetLine(quotedAuthor: string | null, args: string): string {
  if (quotedAuthor) return `Target: ${quotedAuthor}\n`;
  if (args) return `Target/subject: ${args}\n`;
  return "";
}

export const roast: CommandHandler = async ({ message, args, ai, quotedAuthor, quotedText, replyTarget }) => {
  const context = quotedAuthor
    ? `The user "${quotedAuthor}" wrote: "${quotedText}". Roast them hard based on what they said and who they are.${args ? ` Extra instructions: ${args}` : ""}`
    : args
      ? `Roast this person or thing: ${args}`
      : `Generate a savage general roast.`;

  const reply = await generateAI(ai, context,
    "You are a savage, witty Discord bot that delivers brutal roasts. Be creative, specific, and ruthless but keep it fun. Use emojis. No filler openers.");
  await replyTarget.reply({ embeds: [embed(reply)], allowedMentions: { repliedUser: true } });
};

export const compliment: CommandHandler = async ({ message, args, ai, quotedAuthor, quotedText, replyTarget }) => {
  const context = quotedAuthor
    ? `Compliment "${quotedAuthor}" genuinely based on their message: "${quotedText}".${args ? ` Extra: ${args}` : ""}`
    : args
      ? `Give a genuine, warm compliment about: ${args}`
      : `Generate a heartfelt general compliment.`;

  const reply = await generateAI(ai, context,
    "You are a warm Discord bot that delivers genuine, uplifting compliments. Be specific and sincere. Use emojis. No filler openers.");
  await replyTarget.reply({ embeds: [embed(reply)], allowedMentions: { repliedUser: true } });
};

export const rate: CommandHandler = async ({ message, args, ai, quotedAuthor, quotedText, replyTarget }) => {
  const subject = quotedAuthor
    ? `${quotedAuthor}'s message: "${quotedText}"${args ? ` specifically regarding: ${args}` : ""}`
    : args || "whatever the user just said";

  const reply = await generateAI(ai,
    `Rate this on a scale of 1–10 with a brief one-sentence reason and a score like "7/10": ${subject}`,
    "You are a blunt rating bot. Always give a numeric score out of 10 at the end. Be brief and direct. Use emojis.");
  await replyTarget.reply({ embeds: [embed(reply)], allowedMentions: { repliedUser: true } });
};

export const ship: CommandHandler = async ({ message, args, ai, quotedAuthor, replyTarget }) => {
  const person1 = quotedAuthor ?? message.author.username;
  const person2 = args || "their soulmate";

  const reply = await generateAI(ai,
    `Calculate the romantic compatibility between "${person1}" and "${person2}". Give a percentage, a ship name, and a short dramatic verdict.`,
    "You are a dramatic ship calculator bot. Always include a percentage, a cute ship name, and a short verdict. Use heart emojis. No filler openers.");
  await replyTarget.reply({ embeds: [embed(reply)], allowedMentions: { repliedUser: true } });
};

export const fact: CommandHandler = async ({ message, args, ai, replyTarget }) => {
  const topic = args || "something random and interesting";
  const reply = await generateAI(ai,
    `Tell me a fascinating, little-known fact about: ${topic}`,
    "You are a fact-dispensing bot. Give one concise, surprising fact. Start directly with the fact. No filler openers. Use emojis sparingly.");
  await replyTarget.reply({ embeds: [embed(reply)], allowedMentions: { repliedUser: true } });
};

export const joke: CommandHandler = async ({ message, args, ai, replyTarget }) => {
  const topic = args || "anything";
  const reply = await generateAI(ai,
    `Tell a funny joke${topic !== "anything" ? ` about ${topic}` : ""}.`,
    "You are a comedy bot. Deliver one short, genuinely funny joke. Setup then punchline. No filler openers. Emojis welcome.");
  await replyTarget.reply({ embeds: [embed(reply)], allowedMentions: { repliedUser: true } });
};

export const truth: CommandHandler = async ({ message, args, ai, replyTarget }) => {
  const context = args ? `themed around: ${args}` : "interesting and personal";
  const reply = await generateAI(ai,
    `Generate one spicy truth question for a Truth or Dare game, ${context}. Just the question.`,
    "You are a Truth or Dare bot. Give one direct, spicy truth question. No preamble. No filler.");
  await replyTarget.reply({ embeds: [embed(reply)], allowedMentions: { repliedUser: true } });
};

export const dare: CommandHandler = async ({ message, args, ai, replyTarget }) => {
  const context = args ? `themed around: ${args}` : "fun and mildly embarrassing";
  const reply = await generateAI(ai,
    `Generate one dare challenge for a Truth or Dare game, ${context}. Just the dare.`,
    "You are a Truth or Dare bot. Give one direct, creative dare. No preamble. No filler.");
  await replyTarget.reply({ embeds: [embed(reply)], allowedMentions: { repliedUser: true } });
};

export const summarize: CommandHandler = async ({ message, args, ai, quotedAuthor, quotedText, replyTarget }) => {
  if (!quotedText) {
    await message.reply({ embeds: [embed("❌ Reply to a message to summarize it.")] });
    return;
  }
  const reply = await generateAI(ai,
    `Summarize this message from "${quotedAuthor}" in 1–3 concise sentences:\n\n"${quotedText}"`,
    "You are a summarization bot. Be concise and accurate. No filler openers.");
  await replyTarget.reply({ embeds: [embed(reply)], allowedMentions: { repliedUser: true } });
};

export const translate: CommandHandler = async ({ message, args, ai, quotedText, replyTarget }) => {
  const parts = args.split(" ");
  const lang = parts[0];
  const text = quotedText ?? parts.slice(1).join(" ");

  if (!lang || !text) {
    await message.reply({ embeds: [embed("❌ Usage: `?translate [language] [text]` or reply to a message with `?translate [language]`")] });
    return;
  }

  const reply = await generateAI(ai,
    `Translate the following to ${lang}. Output only the translation:\n\n"${text}"`,
    "You are a translation bot. Output only the translated text, nothing else.");
  await replyTarget.reply({ embeds: [embed(reply)], allowedMentions: { repliedUser: true } });
};

export const expose: CommandHandler = async ({ message, args, ai, quotedAuthor, quotedText, replyTarget }) => {
  if (!quotedAuthor || !quotedText) {
    await message.reply({ embeds: [embed("❌ Reply to someone's message to expose them.")] });
    return;
  }
  const reply = await generateAI(ai,
    `Expose "${quotedAuthor}" based on what they wrote. Read between the lines, call out their behavior, and make it dramatic.${args ? ` Extra context: ${args}` : ""}\n\nTheir message: "${quotedText}"`,
    "You are a dramatic exposure bot. Call people out ruthlessly based on what they said. Be theatrical. No filler openers. Emojis welcome.");
  await replyTarget.reply({ embeds: [embed(reply)], allowedMentions: { repliedUser: true } });
};

export const verdict: CommandHandler = async ({ message, args, ai, quotedAuthor, quotedText, replyTarget }) => {
  const subject = quotedAuthor
    ? `"${quotedAuthor}" said: "${quotedText}"${args ? `. Additional context: ${args}` : ""}`
    : args || "the situation";

  const reply = await generateAI(ai,
    `Give a final, definitive verdict on this: ${subject}`,
    "You are a verdict bot. Deliver a clear, confident judgment. Structure it as VERDICT: [guilty/not guilty/mid/based/etc] followed by a short reason. No filler openers. Emojis welcome.");
  await replyTarget.reply({ embeds: [embed(reply)], allowedMentions: { repliedUser: true } });
};

export const bot: CommandHandler = async ({ message, args, ai, quotedAuthor, quotedText, replyTarget }) => {
  let prompt = args;
  if (quotedText) {
    prompt =
      `Context: The user is replying to a message written by "${quotedAuthor ?? "someone"}".\n` +
      `If the user uses pronouns like "him", "her", "them", "he", "she", or "they", they refer to "${quotedAuthor ?? "the person"}".\n` +
      `Original message from ${quotedAuthor ?? "them"}:\n"${quotedText}"\n\n` +
      `User's request:\n"${args}"`;
  }
  if (!prompt) {
    await message.reply({ embeds: [embed("Use `?bot <your message>` to talk to me.")] });
    return;
  }
  const reply = await generateAI(ai, prompt);
  await replyTarget.reply({ embeds: [embed(reply)], allowedMentions: { repliedUser: true } });
};
