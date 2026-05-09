import { type Client, type Message } from "discord.js";
import { type GoogleGenAI } from "@google/genai";

export type CommandContext = {
  message: Message;
  args: string;
  ai: GoogleGenAI;
  client: Client;
  startTime: number;
  quotedAuthor: string | null;
  quotedText: string | null;
  replyTarget: Message;
};

export type CommandHandler = (ctx: CommandContext) => Promise<void>;
