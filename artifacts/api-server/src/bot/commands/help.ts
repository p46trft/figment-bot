import { EmbedBuilder } from "discord.js";
import type { CommandHandler } from "../types";

const HELP_TEXT = `
**🤖 AI Commands**
\`?bot\` — General AI chat
\`?roast\` — Savage roast (reply to target)
\`?compliment\` — Genuine compliment (reply to target)
\`?rate [thing]\` — Rate something out of 10
\`?ship [person]\` — Ship compatibility (reply for target)
\`?fact [topic]\` — Random or topic fact
\`?joke [topic]\` — Tell a joke
\`?truth\` — Generate a truth question
\`?dare\` — Generate a dare
\`?summarize\` — Summarize a message (reply required)
\`?translate [lang]\` — Translate text or replied message
\`?expose\` — Expose someone (reply required)
\`?verdict [topic]\` — Give a definitive verdict

**📊 Server Commands**
\`?ping\` — Bot latency
\`?uptime\` — How long the bot has been running
\`?serverinfo\` — Server stats
\`?userinfo\` — User info (reply or mention)

**🛠️ Utility Commands**
\`?poll [question] | [opt1] | [opt2]\` — Create a poll
\`?announce [text]\` — Post an announcement
\`?welcome\` — Welcome a user (reply to their message)
\`?goodbye\` — Say goodbye to a user
\`?warn [reason]\` — Issue a warning (reply to target)
\`?rules\` — Show server rules
\`?report [reason]\` — Report a user (reply to message)
\`?suggest [idea]\` — Submit a suggestion

**Tip:** Most AI commands work best when you reply to a message first.
`.trim();

export const help: CommandHandler = async ({ message }) => {
  await message.reply({
    embeds: [new EmbedBuilder().setDescription(HELP_TEXT)],
  });
};
