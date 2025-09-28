const { askGemini } = require("../../ai/gemini");

module.exports = {
  name: "gemini",
  description: "Nanya mulu lu cari sendiri kocak! (bisa)",
  async execute(message, args) {
    const question = args.join(" ");
    if (!question) {
      return message.reply(
        "Ngetik yang bener dong, kocak! (Contoh: !gemini siapakah sosok aseli kristofer ?)"
      );
    }

    const thinkingMsg = await message.reply("Lagi mikir sabar dikit... 🤔");
    try {
      const reply = await askGemini(question);
      await thinkingMsg.edit(reply);
    } catch (error) {
      await thinkingMsg.edit("Waduh error nih, coba lagi nanti ya!");
    }
  },
};
