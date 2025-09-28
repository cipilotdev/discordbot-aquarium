const { askHF } = require("../../ai/hf");

module.exports = {
  name: "hf",
  description: "Nanya ke model open-source di Hugging Face (gak bisa)",
  async execute(message, args) {
    const question = args.join(" ");
    if (!question) {
      return message.reply("Ngetik yang bener dong! Contoh: `!hf apa itu AI?`");
    }

    const thinkingMsg = await message.reply("Lagi mikir pake Llama... 🦙");
    try {
      const answer = await askHF(question);
      await thinkingMsg.edit(answer);
    } catch (err) {
      await thinkingMsg.edit("Waduh error, coba lagi nanti!");
    }
  },
};
