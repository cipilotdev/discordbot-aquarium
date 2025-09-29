/**
 * Enhanced help command with better formatting and categorization
 */
const { EmbedBuilder } = require("discord.js");
const config = require("../../config");
const logger = require("../../utils/logger");

module.exports = {
  name: "help",
  description: "Display all available commands",
  category: "Utility",
  usage: "!help [command]",
  aliases: ["h"],

  async execute(message, args) {
    try {
      const commands = message.client.commands;

      // If specific command requested
      if (args.length > 0) {
        const commandName = args[0].toLowerCase();
        const command =
          commands.get(commandName) ||
          commands.find(
            (cmd) => cmd.aliases && cmd.aliases.includes(commandName)
          );

        if (!command) {
          return message.reply(
            `No command found with name or alias: \`${commandName}\``
          );
        }

        return this.sendCommandHelp(message, command);
      }

      // Send full command list
      await this.sendFullHelp(message, commands);
      logger.command("help", message.author.id, message.guild?.id, true);
    } catch (error) {
      logger.error("Help command error", {
        error: error.message,
        userId: message.author.id,
        channelId: message.channel.id,
      });

      message.reply("An error occurred while displaying help information.");
      logger.command("help", message.author.id, message.guild?.id, false);
    }
  },

  async sendCommandHelp(message, command) {
    const embed = new EmbedBuilder()
      .setColor(config.discord.embedColor)
      .setTitle(`Command: ${command.name}`)
      .setDescription(command.description || "No description available")
      .setTimestamp();

    if (command.usage) {
      embed.addFields({
        name: "Usage",
        value: `\`${command.usage}\``,
        inline: false,
      });
    }

    if (command.aliases && command.aliases.length > 0) {
      embed.addFields({
        name: "Aliases",
        value: command.aliases.map((alias) => `\`${alias}\``).join(", "),
        inline: false,
      });
    }

    if (command.category) {
      embed.addFields({
        name: "Category",
        value: command.category,
        inline: true,
      });
    }

    await message.reply({ embeds: [embed] });
  },

  async sendFullHelp(message, commands) {
    const categorized = this.categorizeCommands(commands);

    const embed = new EmbedBuilder()
      .setColor(config.discord.embedColor)
      .setTitle("Discord Bot Commands")
      .setDescription(
        `Use prefix \`${config.discord.prefix}\` before commands.\n\n` +
          `Example: \`${config.discord.prefix}gemini What is AI?\`\n` +
          `For detailed help on a command: \`${config.discord.prefix}help <command>\``
      )
      .setThumbnail(message.client.user.displayAvatarURL())
      .setFooter({
        text: `Total Commands: ${commands.size} | Requested by ${message.author.displayName}`,
        iconURL: message.author.displayAvatarURL(),
      })
      .setTimestamp();

    // Add command categories
    for (const [category, cmds] of Object.entries(categorized)) {
      const commandList = cmds
        .map((cmd) => {
          const aliases = cmd.aliases ? ` (${cmd.aliases.join(", ")})` : "";
          return `\`${cmd.name}${aliases}\` - ${
            cmd.description || "No description"
          }`;
        })
        .join("\n");

      embed.addFields({
        name: `${this.getCategoryEmoji(category)} ${category}`,
        value: commandList || "No commands in this category",
        inline: false,
      });
    }

    // Add additional information
    embed.addFields({
      name: "Need Help?",
      value:
        "Use `!help <command>` for detailed information about a specific command.",
      inline: false,
    });

    await message.reply({ embeds: [embed] });
  },

  categorizeCommands(commands) {
    const categorized = {};

    commands.forEach((command) => {
      const category = command.category || "Other";
      if (!categorized[category]) {
        categorized[category] = [];
      }
      categorized[category].push(command);
    });

    // Sort categories and commands within categories
    const sortedCategorized = {};
    const categoryOrder = ["AI", "Fun", "Utility", "Other"];

    categoryOrder.forEach((category) => {
      if (categorized[category]) {
        sortedCategorized[category] = categorized[category].sort((a, b) =>
          a.name.localeCompare(b.name)
        );
      }
    });

    // Add any remaining categories
    Object.keys(categorized).forEach((category) => {
      if (!categoryOrder.includes(category)) {
        sortedCategorized[category] = categorized[category].sort((a, b) =>
          a.name.localeCompare(b.name)
        );
      }
    });

    return sortedCategorized;
  },

  getCategoryEmoji(category) {
    const emojis = {
      AI: "🤖",
      Fun: "🎮",
      Utility: "🛠️",
      Other: "📁",
    };
    return emojis[category] || "📁";
  },
};
