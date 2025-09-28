const os = require("os");
const { exec } = require("child_process");
const { EmbedBuilder } = require("discord.js");

module.exports = {
  name: "info",
  description: "Tampilin info sistem (OS, uptime, RAM, Disk, Host)",
  category: "Utility",
  async execute(message) {
    const uptimeSec = os.uptime();
    const uptimeH = Math.floor(uptimeSec / 3600);
    const uptimeM = Math.floor((uptimeSec % 3600) / 60);

    const totalMem = (os.totalmem() / 1024 ** 3).toFixed(2);
    const freeMem = (os.freemem() / 1024 ** 3).toFixed(2);
    const usedMem = (totalMem - freeMem).toFixed(2);

    exec("df -h --total | grep total", (err, stdout) => {
      let diskInfo = "Gagal ambil info disk.";
      if (!err && stdout) {
        const parts = stdout.trim().split(/\s+/);
        const size = parts[1];
        const used = parts[2];
        const avail = parts[3];
        const percent = parts[4];
        diskInfo = `${used} / ${size} (${percent} terpakai, sisa ${avail})`;
      }

      const embed = new EmbedBuilder()
        .setColor(0x1abc9c)
        .setTitle("Info Sistem")
        .addFields(
          {
            name: "OS",
            value: `${os.type()} ${os.release()} (${os.arch()})`,
            inline: false,
          },
          { name: "Hostname", value: os.hostname(), inline: true },
          { name: "Uptime", value: `${uptimeH}h ${uptimeM}m`, inline: true },
          {
            name: "Memory",
            value: `${usedMem}GB / ${totalMem}GB (Free: ${freeMem}GB)`,
            inline: false,
          },
          { name: "Disk", value: diskInfo, inline: false }
        )
        .setFooter({ text: "Server Runnning" })
        .setTimestamp();

      message.reply({ embeds: [embed] });
    });
  },
};
