import type { CommandHandler } from "../types";
import { bot, compliment, dare, expose, fact, joke, rate, roast, ship, summarize, translate, truth, verdict } from "./ai";
import { ping, serverinfo, uptime, userinfo } from "./discord";
import { announce, goodbye, poll, report, rules, suggest, warn, welcome } from "./utility";
import { help } from "./help";

export const commands = new Map<string, CommandHandler>([
  ["bot", bot],
  ["roast", roast],
  ["compliment", compliment],
  ["rate", rate],
  ["ship", ship],
  ["fact", fact],
  ["joke", joke],
  ["truth", truth],
  ["dare", dare],
  ["summarize", summarize],
  ["translate", translate],
  ["expose", expose],
  ["verdict", verdict],
  ["ping", ping],
  ["uptime", uptime],
  ["serverinfo", serverinfo],
  ["userinfo", userinfo],
  ["poll", poll],
  ["announce", announce],
  ["welcome", welcome],
  ["goodbye", goodbye],
  ["warn", warn],
  ["rules", rules],
  ["report", report],
  ["suggest", suggest],
  ["help", help],
]);
