/**
 * Enhanced Discord bot with improved structure, error handling, and performance
 */
require("dotenv").config();
const { Client, GatewayIntentBits, Collection, Events } = require("discord.js");
const fs = require("fs");
const path = require("path");
const config = require("./config");
const logger = require("./utils/logger");
const rateLimiter = require("./utils/rateLimiter");
const Validator = require("./utils/validator");
const database = require("./services/database");

class DiscordBot {
  constructor() {
    this.client = new Client({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
      ],
      presence: {
        status: "online",
        activities: [
          {
            name: "Type !help for commands",
            type: "WATCHING",
          },
        ],
      },
    });

    this.client.commands = new Collection();
    this.setupEventListeners();
    this.loadCommands();

    // Setup periodic cleanup tasks
    this.setupCleanupTasks();
  }

  setupEventListeners() {
    this.client.once(Events.ClientReady, this.onReady.bind(this));
    this.client.on(Events.MessageCreate, this.onMessageCreate.bind(this));
    this.client.on(Events.Error, this.onError.bind(this));
    this.client.on(Events.Warn, this.onWarn.bind(this));

    // Graceful shutdown
    process.on("SIGINT", this.shutdown.bind(this));
    process.on("SIGTERM", this.shutdown.bind(this));
    process.on("uncaughtException", this.onUncaughtException.bind(this));
    process.on("unhandledRejection", this.onUnhandledRejection.bind(this));
  }

  loadCommands() {
    const commandsPath = path.join(__dirname, "command");

    try {
      this.loadCommandsRecursively(commandsPath);
      logger.info(`Successfully loaded ${this.client.commands.size} commands`);
    } catch (error) {
      logger.error("Failed to load commands", { error: error.message });
      process.exit(1);
    }
  }

  loadCommandsRecursively(dir) {
    const files = fs.readdirSync(dir);

    for (const file of files) {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);

      if (stat.isDirectory()) {
        this.loadCommandsRecursively(filePath);
      } else if (file.endsWith(".js")) {
        try {
          // Clear require cache for hot reload in development
          if (process.env.NODE_ENV === "development") {
            delete require.cache[require.resolve(filePath)];
          }

          const command = require(filePath);

          if (!command.name) {
            logger.warn(`Command file ${filePath} is missing name property`);
            continue;
          }

          this.client.commands.set(command.name, command);

          // Register aliases
          if (command.aliases && Array.isArray(command.aliases)) {
            command.aliases.forEach((alias) => {
              this.client.commands.set(alias, command);
            });
          }

          logger.debug(`Loaded command: ${command.name}`);
        } catch (error) {
          logger.error(`Failed to load command from ${filePath}`, {
            error: error.message,
          });
        }
      }
    }
  }

  async onReady() {
    logger.info(`Bot logged in as ${this.client.user.tag}`);
    logger.info(
      `Serving ${this.client.guilds.cache.size} guilds with ${this.client.users.cache.size} users`
    );

    // Perform health checks
    await this.performHealthChecks();
  }

  async performHealthChecks() {
    try {
      const dbHealthy = await database.healthCheck();
      logger.info("Database health check", {
        status: dbHealthy ? "healthy" : "unhealthy",
      });

      if (!dbHealthy) {
        logger.warn("Database is not responding properly");
      }
    } catch (error) {
      logger.error("Health check failed", { error: error.message });
    }
  }

  async onMessageCreate(message) {
    // Ignore bots and non-prefixed messages
    if (
      message.author.bot ||
      !message.content.startsWith(config.discord.prefix)
    ) {
      return;
    }

    // Parse command and arguments
    const args = message.content
      .slice(config.discord.prefix.length)
      .trim()
      .split(/ +/);
    const commandName = args.shift().toLowerCase();

    if (!Validator.isValidCommand(commandName)) {
      return;
    }

    const command = this.client.commands.get(commandName);
    if (!command) {
      return;
    }

    // Rate limiting check
    if (
      rateLimiter.isRateLimited(
        message.author.id,
        "general",
        config.rateLimits.general
      )
    ) {
      const timeLeft = Math.ceil(
        rateLimiter.getTimeUntilReset(
          message.author.id,
          "general",
          config.rateLimits.general
        ) / 1000
      );
      return message.reply(
        `Rate limit exceeded. Please wait ${timeLeft} seconds before using commands again.`
      );
    }

    try {
      // Log command execution attempt
      logger.debug("Executing command", {
        command: commandName,
        user: message.author.id,
        guild: message.guild?.id,
        channel: message.channel.id,
      });

      await command.execute(message, args);
    } catch (error) {
      logger.error(`Command execution failed`, {
        command: commandName,
        user: message.author.id,
        guild: message.guild?.id,
        error: error.message,
        stack: error.stack,
      });

      try {
        await message.reply({
          content:
            "An error occurred while executing this command. The error has been logged and will be investigated.",
          allowedMentions: { repliedUser: false },
        });
      } catch (replyError) {
        logger.error("Failed to send error message to user", {
          error: replyError.message,
          originalError: error.message,
        });
      }
    }
  }

  setupCleanupTasks() {
    // Clean up rate limiter every 10 minutes
    setInterval(() => {
      rateLimiter.cleanup();
      database.cleanupCache();
      logger.debug("Performed periodic cleanup tasks");
    }, 600000);

    // Log statistics every hour
    setInterval(() => {
      this.logStatistics();
    }, 3600000);
  }

  logStatistics() {
    const stats = {
      guilds: this.client.guilds.cache.size,
      users: this.client.users.cache.size,
      commands: this.client.commands.size,
      uptime: Math.floor(process.uptime()),
      memoryUsage: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
    };

    logger.info("Bot statistics", stats);
  }

  onError(error) {
    logger.error("Discord client error", {
      error: error.message,
      stack: error.stack,
    });
  }

  onWarn(warning) {
    logger.warn("Discord client warning", { warning });
  }

  onUncaughtException(error) {
    logger.error("Uncaught exception", {
      error: error.message,
      stack: error.stack,
    });
    this.shutdown(1);
  }

  onUnhandledRejection(reason, promise) {
    logger.error("Unhandled promise rejection", { reason, promise });
  }

  async shutdown(exitCode = 0) {
    logger.info("Shutting down bot gracefully...");

    try {
      this.client.destroy();
      await database.clearCache();
      logger.info("Bot shutdown complete");
    } catch (error) {
      logger.error("Error during shutdown", { error: error.message });
    } finally {
      process.exit(exitCode);
    }
  }

  async start() {
    if (!config.discord.token) {
      logger.error("Discord bot token is not provided");
      process.exit(1);
    }

    try {
      await this.client.login(config.discord.token);
    } catch (error) {
      logger.error("Failed to login to Discord", { error: error.message });
      process.exit(1);
    }
  }
}

// Start the bot
const bot = new DiscordBot();
bot.start().catch((error) => {
  logger.error("Failed to start bot", { error: error.message });
  process.exit(1);
});
