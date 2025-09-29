/**
 * Enhanced system info command with better error handling and formatting
 */
const os = require("os");
const { exec } = require("child_process");
const { EmbedBuilder } = require("discord.js");
const config = require("../../config");
const logger = require("../../utils/logger");

module.exports = {
  name: "info",
  description: "Display system information (OS, uptime, memory, disk)",
  category: "Utility",
  usage: "!info",
  aliases: ["system", "stats"],

  async execute(message) {
    try {
      const systemInfo = this.getBasicSystemInfo();
      const diskInfo = await this.getDiskInfo();

      const embed = new EmbedBuilder()
        .setColor(config.discord.embedColor)
        .setTitle("System Information")
        .addFields(
          {
            name: "Operating System",
            value: `${systemInfo.os} ${systemInfo.release} (${systemInfo.arch})`,
            inline: false,
          },
          {
            name: "Hostname",
            value: systemInfo.hostname,
            inline: true,
          },
          {
            name: "Uptime",
            value: systemInfo.uptime,
            inline: true,
          },
          {
            name: "Node.js Version",
            value: process.version,
            inline: true,
          },
          {
            name: "Memory Usage",
            value: systemInfo.memory,
            inline: false,
          },
          {
            name: "Disk Usage",
            value: diskInfo,
            inline: false,
          },
          {
            name: "Bot Statistics",
            value: this.getBotStats(message.client),
            inline: false,
          }
        )
        .setFooter({ text: "System Status: Online" })
        .setTimestamp();

      await message.reply({ embeds: [embed] });
      logger.command("info", message.author.id, message.guild?.id, true);
    } catch (error) {
      logger.error("Info command error", {
        error: error.message,
        userId: message.author.id,
        channelId: message.channel.id,
      });

      message.reply("An error occurred while retrieving system information.");
      logger.command("info", message.author.id, message.guild?.id, false);
    }
  },

  getBasicSystemInfo() {
    const uptimeSec = os.uptime();
    const uptimeH = Math.floor(uptimeSec / 3600);
    const uptimeM = Math.floor((uptimeSec % 3600) / 60);

    const totalMem = (os.totalmem() / 1024 ** 3).toFixed(2);
    const freeMem = (os.freemem() / 1024 ** 3).toFixed(2);
    const usedMem = (totalMem - freeMem).toFixed(2);
    const memPercent = ((usedMem / totalMem) * 100).toFixed(1);

    return {
      os: os.type(),
      release: os.release(),
      arch: os.arch(),
      hostname: os.hostname(),
      uptime: `${uptimeH}h ${uptimeM}m`,
      memory: `${usedMem}GB / ${totalMem}GB (${memPercent}% used, ${freeMem}GB free)`,
    };
  },

  getBotStats(client) {
    const processUptime = process.uptime();
    const botUptimeH = Math.floor(processUptime / 3600);
    const botUptimeM = Math.floor((processUptime % 3600) / 60);

    const memUsage = process.memoryUsage();
    const heapUsed = (memUsage.heapUsed / 1024 ** 2).toFixed(2);
    const heapTotal = (memUsage.heapTotal / 1024 ** 2).toFixed(2);

    return [
      `Guilds: ${client.guilds.cache.size}`,
      `Users: ${client.users.cache.size}`,
      `Commands: ${client.commands.size}`,
      `Bot Uptime: ${botUptimeH}h ${botUptimeM}m`,
      `Heap Usage: ${heapUsed}MB / ${heapTotal}MB`,
    ].join("\n");
  },

  getDiskInfo() {
    return new Promise((resolve) => {
      exec("df -h --total | grep total", (err, stdout) => {
        if (err || !stdout) {
          resolve("Unable to retrieve disk information");
          return;
        }

        try {
          const parts = stdout.trim().split(/\s+/);
          if (parts.length < 5) {
            resolve("Unable to parse disk information");
            return;
          }

          const size = parts[1];
          const used = parts[2];
          const avail = parts[3];
          const percent = parts[4];

          resolve(`${used} / ${size} (${percent} used, ${avail} available)`);
        } catch (parseError) {
          logger.warn("Error parsing disk information", {
            error: parseError.message,
          });
          resolve("Unable to parse disk information");
        }
      });
    });
  },
};
