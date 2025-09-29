const { exec } = require("child_process");
const { EmbedBuilder } = require("discord.js");

module.exports = {
  name: "fastfetch",
  description: "Tampilkan info sistem pake fastfetch (harus install dulu)",
  category: "Utility",
  async execute(message) {
    exec("fastfetch --stdout", (err, stdout, stderr) => {
      if (err) {
        message.reply(
          `Gagal ngejalanin fastfetch. Pastikan fastfetch udah terinstall.\nError: ${err.message}`
        );
        return;
      }

      // Batasi output supaya muat di Discord embed
      const output =
        stdout.length > 4090 ? stdout.slice(0, 4090) + "..." : stdout;

      const embed = new EmbedBuilder()
        .setColor(0x1abc9c)
        .setTitle("Info Sistem (fastfetch)")
        .setDescription(`\`\`\`\n${output}\n\`\`\``)
        .setFooter({ text: "Server Running" })
        .setTimestamp();

      message.reply({ embeds: [embed] });
    });
  },
};
