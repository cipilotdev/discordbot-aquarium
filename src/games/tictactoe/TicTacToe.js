/**
 * Tic-tac-toe game implementation
 */
const config = require("../../config");
const logger = require("../../utils/logger");
const { EmbedBuilder } = require("discord.js");

class TicTacToeGame {
  constructor(player1Id, player2Id = null) {
    this.player1 = player1Id;
    this.player2 = player2Id;
    this.currentPlayer = player1Id;
    this.board = Array(9).fill(config.games.tictactoe.symbols.empty);
    this.gameState = "waiting"; // waiting, playing, finished
    this.winner = null;
    this.createdAt = Date.now();
    this.lastMoveAt = Date.now();
  }

  isValidMove(position) {
    return (
      position >= 1 &&
      position <= 9 &&
      this.board[position - 1] === config.games.tictactoe.symbols.empty
    );
  }

  makeMove(playerId, position) {
    if (this.gameState !== "playing") {
      return { success: false, message: "Game is not in progress" };
    }

    if (playerId !== this.currentPlayer) {
      return { success: false, message: "Not your turn" };
    }

    if (!this.isValidMove(position)) {
      return { success: false, message: "Invalid move position" };
    }

    const symbol =
      playerId === this.player1
        ? config.games.tictactoe.symbols.player1
        : config.games.tictactoe.symbols.player2;

    this.board[position - 1] = symbol;
    this.lastMoveAt = Date.now();

    // Check for winner
    if (this.checkWinner()) {
      this.gameState = "finished";
      this.winner = playerId;
      return {
        success: true,
        message: "Move successful",
        gameState: "won",
        winner: playerId,
      };
    }

    // Check for draw
    if (this.isBoardFull()) {
      this.gameState = "finished";
      return {
        success: true,
        message: "Move successful",
        gameState: "draw",
      };
    }

    // Switch players
    this.currentPlayer =
      this.currentPlayer === this.player1 ? this.player2 : this.player1;

    return {
      success: true,
      message: "Move successful",
      gameState: "continue",
      nextPlayer: this.currentPlayer,
    };
  }

  checkWinner() {
    const winningCombinations = [
      [0, 1, 2],
      [3, 4, 5],
      [6, 7, 8], // rows
      [0, 3, 6],
      [1, 4, 7],
      [2, 5, 8], // columns
      [0, 4, 8],
      [2, 4, 6], // diagonals
    ];

    return winningCombinations.some((combination) => {
      const [a, b, c] = combination;
      return (
        this.board[a] !== config.games.tictactoe.symbols.empty &&
        this.board[a] === this.board[b] &&
        this.board[b] === this.board[c]
      );
    });
  }

  isBoardFull() {
    return !this.board.includes(config.games.tictactoe.symbols.empty);
  }

  isExpired() {
    return Date.now() - this.lastMoveAt > config.games.tictactoe.timeout;
  }

  getBoardDisplay() {
    let display = "```\n";
    display += "Positions: | Current Board:\n";
    display += "1 | 2 | 3  |  " + this.formatRow(0, 1, 2) + "\n";
    display += "4 | 5 | 6  |  " + this.formatRow(3, 4, 5) + "\n";
    display += "7 | 8 | 9  |  " + this.formatRow(6, 7, 8) + "\n";
    display += "```";
    return display;
  }

  formatRow(pos1, pos2, pos3) {
    const formatCell = (cell) =>
      cell === config.games.tictactoe.symbols.empty ? " " : cell;
    return `${formatCell(this.board[pos1])} | ${formatCell(
      this.board[pos2]
    )} | ${formatCell(this.board[pos3])}`;
  }

  getGameEmbed(client) {
    const embed = new EmbedBuilder()
      .setColor(config.discord.embedColor)
      .setTitle("Tic-Tac-Toe Game")
      .setDescription(this.getBoardDisplay())
      .setTimestamp();

    if (this.gameState === "waiting") {
      embed.addFields({
        name: "Status",
        value: "Waiting for second player",
        inline: true,
      });
    } else if (this.gameState === "playing") {
      const currentPlayerUser = client.users.cache.get(this.currentPlayer);
      embed.addFields({
        name: "Current Turn",
        value: currentPlayerUser
          ? currentPlayerUser.displayName
          : "Unknown Player",
        inline: true,
      });
    } else if (this.gameState === "finished") {
      if (this.winner) {
        const winnerUser = client.users.cache.get(this.winner);
        embed.addFields({
          name: "Winner",
          value: winnerUser ? winnerUser.displayName : "Unknown Player",
          inline: true,
        });
      } else {
        embed.addFields({
          name: "Result",
          value: "Draw",
          inline: true,
        });
      }
    }

    if (this.player1 && this.player2) {
      const player1User = client.users.cache.get(this.player1);
      const player2User = client.users.cache.get(this.player2);
      embed.addFields({
        name: "Players",
        value: `${config.games.tictactoe.symbols.player1}: ${
          player1User ? player1User.displayName : "Unknown"
        }\n${config.games.tictactoe.symbols.player2}: ${
          player2User ? player2User.displayName : "Unknown"
        }`,
        inline: true,
      });
    }

    return embed;
  }
}

class TicTacToeManager {
  constructor() {
    this.activeGames = new Map();
    this.gameTimeouts = new Map();

    // Clean up expired games every 5 minutes
    setInterval(() => this.cleanupExpiredGames(), 300000);
  }

  createGame(player1Id, channelId) {
    const gameKey = `${channelId}-${player1Id}`;

    if (this.activeGames.has(gameKey)) {
      return {
        success: false,
        message: "You already have an active game in this channel",
      };
    }

    const game = new TicTacToeGame(player1Id);
    this.activeGames.set(gameKey, game);

    logger.info("Tic-tac-toe game created", {
      player1: player1Id,
      channel: channelId,
    });

    return { success: true, game, gameKey };
  }

  joinGame(player2Id, channelId, targetPlayerId) {
    const gameKey = `${channelId}-${targetPlayerId}`;
    const game = this.activeGames.get(gameKey);

    if (!game) {
      return {
        success: false,
        message: "No active game found for that player",
      };
    }

    if (game.gameState !== "waiting") {
      return {
        success: false,
        message: "Game is already in progress or finished",
      };
    }

    if (game.player1 === player2Id) {
      return { success: false, message: "You cannot play against yourself" };
    }

    game.player2 = player2Id;
    game.gameState = "playing";

    logger.info("Player joined tic-tac-toe game", {
      player1: game.player1,
      player2: player2Id,
      channel: channelId,
    });

    return { success: true, game };
  }

  makeMove(playerId, channelId, position) {
    let game = null;
    let gameKey = null;

    // Find the game where this player is participating
    for (const [key, activeGame] of this.activeGames.entries()) {
      if (
        key.includes(channelId) &&
        (activeGame.player1 === playerId || activeGame.player2 === playerId)
      ) {
        game = activeGame;
        gameKey = key;
        break;
      }
    }

    if (!game) {
      return {
        success: false,
        message: "You are not in any active game in this channel",
      };
    }

    const moveResult = game.makeMove(playerId, position);

    if (moveResult.success && game.gameState === "finished") {
      this.endGame(gameKey);
    }

    return {
      success: moveResult.success,
      message: moveResult.message,
      game,
      moveResult,
    };
  }

  getGame(channelId, playerId = null) {
    if (playerId) {
      const gameKey = `${channelId}-${playerId}`;
      return this.activeGames.get(gameKey);
    }

    // Find any game in this channel
    for (const [key, game] of this.activeGames.entries()) {
      if (key.includes(channelId)) {
        return game;
      }
    }

    return null;
  }

  endGame(gameKey) {
    if (this.activeGames.has(gameKey)) {
      this.activeGames.delete(gameKey);
      logger.info("Tic-tac-toe game ended", { gameKey });
    }

    if (this.gameTimeouts.has(gameKey)) {
      clearTimeout(this.gameTimeouts.get(gameKey));
      this.gameTimeouts.delete(gameKey);
    }
  }

  cleanupExpiredGames() {
    const expiredGames = [];

    for (const [key, game] of this.activeGames.entries()) {
      if (game.isExpired()) {
        expiredGames.push(key);
      }
    }

    expiredGames.forEach((key) => {
      this.endGame(key);
      logger.info("Cleaned up expired tic-tac-toe game", { gameKey: key });
    });
  }

  getActiveGameCount() {
    return this.activeGames.size;
  }
}

module.exports = { TicTacToeGame, TicTacToeManager };
