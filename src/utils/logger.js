/**
 * Logging utility for the Discord bot
 */
const fs = require("fs");
const path = require("path");

class Logger {
  constructor() {
    this.logDir = path.join(__dirname, "../../logs");
    this.ensureLogDirectory();
  }

  ensureLogDirectory() {
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  formatMessage(level, message, meta = {}) {
    const timestamp = new Date().toISOString();
    const metaStr = Object.keys(meta).length > 0 ? JSON.stringify(meta) : "";
    return `[${timestamp}] ${level.toUpperCase()}: ${message} ${metaStr}\n`;
  }

  writeToFile(level, message, meta = {}) {
    const logFile = path.join(this.logDir, `${level}.log`);
    const formattedMessage = this.formatMessage(level, message, meta);

    fs.appendFile(logFile, formattedMessage, (err) => {
      if (err) console.error("Failed to write to log file:", err);
    });
  }

  info(message, meta = {}) {
    console.log(`INFO: ${message}`, meta);
    this.writeToFile("info", message, meta);
  }

  warn(message, meta = {}) {
    console.warn(`WARN: ${message}`, meta);
    this.writeToFile("warn", message, meta);
  }

  error(message, meta = {}) {
    console.error(`ERROR: ${message}`, meta);
    this.writeToFile("error", message, meta);
  }

  debug(message, meta = {}) {
    if (process.env.NODE_ENV === "development") {
      console.debug(`DEBUG: ${message}`, meta);
      this.writeToFile("debug", message, meta);
    }
  }

  command(commandName, userId, guildId, success = true) {
    const message = `Command ${commandName} executed by ${userId} in guild ${guildId}`;
    const meta = {
      command: commandName,
      user: userId,
      guild: guildId,
      success,
    };

    if (success) {
      this.info(message, meta);
    } else {
      this.warn(`${message} - FAILED`, meta);
    }
  }
}

module.exports = new Logger();
