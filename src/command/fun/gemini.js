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

    if (question.length > 1000) {
      return message.reply(
        "Pertanyaan lu kepanjangan bjir, maksimal 1000 karakter."
      );
    }

    const thinkingMsg = await message.reply("Lagi mikir sabar dikit... 🤔");

    try {
      // pass userId dan channelId ke askGemini
      const reply = await askGemini(
        message.author.id,
        message.channel.id,
        question
      );
      await thinkingMsg.edit(reply);
    } catch (error) {
      console.error("Discord command error:", error);
      await thinkingMsg.edit("Waduh error nih, coba lagi nanti ya!");
    }
  },
};
