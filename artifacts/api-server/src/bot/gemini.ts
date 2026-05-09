import { GoogleGenAI } from "@google/genai";

const GEMINI_MODEL = "gemini-2.5-flash";

export const BASE_SYSTEM =
  "You are a precise, no-nonsense Discord bot. Execute requests directly and accurately. You may use emojis and symbols where appropriate. Never use filler phrases like 'Got it!', 'Sure thing!', 'Great question!', 'Of course!', or any similar opener or closer. Do not pad responses — just deliver the answer or action immediately. Use plain text; only use code blocks when the user asks for code.";

export function createGeminiClient(): GoogleGenAI {
  const apiKey = process.env["GEMINI_API_KEY"];
  if (!apiKey) throw new Error("GEMINI_API_KEY is not set");
  return new GoogleGenAI({ apiKey });
}

export async function generateAI(
  ai: GoogleGenAI,
  prompt: string,
  systemInstruction: string = BASE_SYSTEM,
): Promise<string> {
  const response = await ai.models.generateContent({
    model: GEMINI_MODEL,
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    config: { maxOutputTokens: 8192, systemInstruction },
  });
  return response.text ?? "No response generated.";
}

export function truncate(text: string, max = 4000): string {
  if (text.length <= max) return text;
  return text.slice(0, max - 3) + "...";
}
