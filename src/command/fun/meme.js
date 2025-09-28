const fetch = require("node-fetch");

module.exports = {
  name: "meme",
  description: "Ngasih random meme dari internet",
  async execute(message) {
    try {
      const res = await fetch(process.env.MEME_API_URL);
      const data = await res.json();

      if (!data || !data.url) {
        return message.reply("Gagal dapet meme. Semoga harimu suram");
      }

      await message.channel.send({
        content: `**${data.title}**\nFrom r/${data.subreddit}`,
        files: [data.url],
      });
    } catch (err) {
      console.error("Meme API Error:", err);
      message.reply("Waduh! ERROR! ERROR!");
    }
  },
};
