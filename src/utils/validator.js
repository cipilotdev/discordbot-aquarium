/**
 * Input validation utilities
 */
const config = require("../config");

class Validator {
  static isValidPrompt(prompt) {
    if (typeof prompt !== "string") return false;
    if (prompt.trim().length === 0) return false;
    if (prompt.length > config.apis.gemini.maxPromptLength) return false;
    return true;
  }

  static sanitizeInput(input) {
    if (typeof input !== "string") return "";
    return input.trim().replace(/[<>@!&]/g, "");
  }

  static isValidDiscordId(id) {
    return /^\d{17,19}$/.test(id);
  }

  static isValidCommand(command) {
    if (typeof command !== "string") return false;
    return /^[a-zA-Z0-9_-]+$/.test(command);
  }

  static validateGameMove(move, gameType = "tictactoe") {
    switch (gameType) {
      case "tictactoe":
        return this.validateTicTacToeMove(move);
      default:
        return false;
    }
  }

  static validateTicTacToeMove(move) {
    if (typeof move !== "number") return false;
    return move >= 1 && move <= 9;
  }

  static truncateMessage(message, maxLength = config.discord.maxMessageLength) {
    if (message.length <= maxLength) return message;
    return message.substring(0, maxLength - 3) + "...";
  }
}

module.exports = Validator;
