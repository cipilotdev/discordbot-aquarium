const { EmbedBuilder } = require("discord.js");

module.exports = {
  name: "help",
  description: "Menampilkan semua command yang tersedia",
  async execute(message, args) {
    const commands = message.client.commands;

    const categorized = {};
    commands.forEach((command) => {
      const category = command.category || "Lainnya";
      if (!categorized[category]) categorized[category] = [];
      categorized[category].push(command);
    });

    const embed = new EmbedBuilder()
      .setColor(0x5865f2)
      .setTitle("Daftar Command Bot")
      .setDescription(
        "Gunakan prefix `!` sebelum command.\n\nContoh: `!gemini siapa presiden Indonesia?`"
      )
      .setThumbnail(message.client.user.displayAvatarURL())
      .setImage("https://i.imgur.com/AfFp7pu.png")
      .setFooter({
        text: "Bot dibuat oleh Raja Iblis",
        iconURL: message.author.displayAvatarURL(),
      })
      .setTimestamp();

    for (const [category, cmds] of Object.entries(categorized)) {
      let cmdList = cmds
        .map(
          (cmd) => `**!${cmd.name}** - ${cmd.description || "No description"}`
        )
        .join("\n");

      embed.addFields({
        name: `${category}`,
        value: cmdList,
        inline: false,
      });
    }

    await message.reply({ embeds: [embed] });
  },
};
