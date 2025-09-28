const { askGPT } = require("../../ai/gpt");

module.exports = {
  name: "gpt",
  description: "Nanya mulu lu cari sendiri kocak! (gak bisa)",
  async execute(message, args) {
    const question = args.join(" ");
    if (!question) {
      return message.reply(
        "Ngetik yang bener dong, kocak! (Contoh: !gpt siapakah sosok aseli kristofer ?)"
      );
    }

    const thinkingMsg = await message.reply("Lagi mikir sabar dikit... 🤔");
    const answer = await askGPT(question);
    thinkingMsg.delete();
    await message.reply(answer);
  },
};
