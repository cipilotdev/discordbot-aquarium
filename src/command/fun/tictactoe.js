/**
 * Tic-tac-toe Discord command
 */
const { TicTacToeManager } = require("../../games/tictactoe/TicTacToe");
const Validator = require("../../utils/validator");
const logger = require("../../utils/logger");
const { EmbedBuilder } = require("discord.js");

const gameManager = new TicTacToeManager();

module.exports = {
  name: "tictactoe",
  description: "Play tic-tac-toe with another player",
  category: "Fun",
  usage: "!tictactoe [new|join @user|move <1-9>|status|quit]",
  aliases: ["ttt"],

  async execute(message, args) {
    const action = args[0]?.toLowerCase();

    try {
      switch (action) {
        case "new":
        case "start":
          await this.handleNewGame(message);
          break;

        case "join":
          await this.handleJoinGame(message, args);
          break;

        case "move":
        case "m":
          await this.handleMove(message, args);
          break;

        case "status":
        case "board":
          await this.handleStatus(message);
          break;

        case "quit":
        case "end":
          await this.handleQuit(message);
          break;

        default:
          await this.sendHelp(message);
          break;
      }

      logger.command("tictactoe", message.author.id, message.guild?.id, true);
    } catch (error) {
      logger.error("Tic-tac-toe command error", {
        error: error.message,
        user: message.author.id,
        action,
      });
      await message.reply(
        "An error occurred while processing the tic-tac-toe command."
      );
      logger.command("tictactoe", message.author.id, message.guild?.id, false);
    }
  },

  async handleNewGame(message) {
    const result = gameManager.createGame(
      message.author.id,
      message.channel.id
    );

    if (!result.success) {
      return message.reply(result.message);
    }

    const embed = result.game.getGameEmbed(message.client);
    embed.addFields({
      name: "How to play",
      value:
        "Waiting for another player to join with `!tictactoe join @" +
        message.author.username +
        "`\nUse `!tictactoe move <1-9>` to make moves.",
      inline: false,
    });

    await message.reply({ embeds: [embed] });
  },

  async handleJoinGame(message, args) {
    if (args.length < 2) {
      return message.reply(
        "Please mention the player whose game you want to join: `!tictactoe join @username`"
      );
    }

    const targetUser = message.mentions.users.first();
    if (!targetUser) {
      return message.reply("Please mention a valid user to join their game.");
    }

    const result = gameManager.joinGame(
      message.author.id,
      message.channel.id,
      targetUser.id
    );

    if (!result.success) {
      return message.reply(result.message);
    }

    const embed = result.game.getGameEmbed(message.client);
    embed.addFields({
      name: "Game Started",
      value:
        "Use `!tictactoe move <1-9>` to make your move. Player X goes first!",
      inline: false,
    });

    await message.reply({ embeds: [embed] });
  },

  async handleMove(message, args) {
    if (args.length < 2) {
      return message.reply(
        "Please specify a position (1-9): `!tictactoe move 5`"
      );
    }

    const position = parseInt(args[1]);

    if (!Validator.validateGameMove(position, "tictactoe")) {
      return message.reply("Please enter a valid position (1-9).");
    }

    const result = gameManager.makeMove(
      message.author.id,
      message.channel.id,
      position
    );

    if (!result.success) {
      return message.reply(result.message);
    }

    const embed = result.game.getGameEmbed(message.client);

    if (result.moveResult.gameState === "won") {
      embed.addFields({
        name: "Game Over",
        value: `Congratulations! You won the game!`,
        inline: false,
      });
    } else if (result.moveResult.gameState === "draw") {
      embed.addFields({
        name: "Game Over",
        value: "The game ended in a draw!",
        inline: false,
      });
    } else {
      const nextPlayerUser = message.client.users.cache.get(
        result.moveResult.nextPlayer
      );
      embed.addFields({
        name: "Next Turn",
        value: `${
          nextPlayerUser ? nextPlayerUser.displayName : "Unknown Player"
        }'s turn`,
        inline: false,
      });
    }

    await message.reply({ embeds: [embed] });
  },

  async handleStatus(message) {
    const game = gameManager.getGame(message.channel.id);

    if (!game) {
      return message.reply("No active tic-tac-toe game in this channel.");
    }

    const embed = game.getGameEmbed(message.client);
    await message.reply({ embeds: [embed] });
  },

  async handleQuit(message) {
    const game = gameManager.getGame(message.channel.id);

    if (!game) {
      return message.reply("No active tic-tac-toe game in this channel.");
    }

    if (
      game.player1 !== message.author.id &&
      game.player2 !== message.author.id
    ) {
      return message.reply("You are not a player in the current game.");
    }

    // Find and end the game
    for (const [key, activeGame] of gameManager.activeGames.entries()) {
      if (activeGame === game) {
        gameManager.endGame(key);
        break;
      }
    }

    const embed = new EmbedBuilder()
      .setColor(0xff0000)
      .setTitle("Game Ended")
      .setDescription(`${message.author.displayName} quit the game.`)
      .setTimestamp();

    await message.reply({ embeds: [embed] });
  },

  async sendHelp(message) {
    const embed = new EmbedBuilder()
      .setColor(0x5865f2)
      .setTitle("Tic-Tac-Toe Help")
      .setDescription("Play tic-tac-toe with another player!")
      .addFields(
        {
          name: "Commands",
          value: [
            "`!tictactoe new` - Start a new game",
            "`!tictactoe join @user` - Join someone's game",
            "`!tictactoe move <1-9>` - Make a move",
            "`!tictactoe status` - Show current game",
            "`!tictactoe quit` - Quit current game",
          ].join("\n"),
          inline: false,
        },
        {
          name: "How to Play",
          value: [
            "1. Start a new game with `!tictactoe new`",
            "2. Another player joins with `!tictactoe join @you`",
            "3. Take turns making moves with `!tictactoe move <position>`",
            "4. First to get 3 in a row wins!",
          ].join("\n"),
          inline: false,
        }
      )
      .setTimestamp();

    await message.reply({ embeds: [embed] });
  },
};
