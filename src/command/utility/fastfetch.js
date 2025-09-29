const { exec } = require("child_process");
const { EmbedBuilder } = require("discord.js");

module.exports = {
  name: "fastfetch",
  description: "Tampilin info sistem pake fastfetch (harus install dulu)",
  category: "Utility",
  async execute(message) {
    exec("fastfetch", (err, stdout, stderr) => {
      if (err) {
        message.reply(
          `Gagal ngejalanin fastfetch. Pastikan fastfetch udah terinstall di server.\nError: ${err.message}`
        );
        return;
      }
      const embed = new EmbedBuilder()
        .setColor(0x1abc9c)
        .setTitle("Info Sistem (fastfetch)")
        .setDescription("```" + stdout + "```")
        .setFooter({ text: "Server Running" })
        .setTimestamp();
      message.reply({ embeds: [embed] });
    });
  },
};

// exec("fastfetch", (err, stdout, stderr) => {
//   if (err) {
//     console.error("Gagal ngejalanin fastfetch:", err);
//     return;
//   }
//   console.log("Output fastfetch:\n", stdout);
// });
