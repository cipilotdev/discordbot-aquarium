/**
 * CIA AI command with enhanced error handling and rate limiting
 */
const geminiService = require("../../ai/cia");
const rateLimiter = require("../../utils/rateLimiter");
const config = require("../../config");
const logger = require("../../utils/logger");
const Validator = require("../../utils/validator");

module.exports = {
  name: "cia",
  description: "Ask questions to CIA's advanced AI system",
  category: "AI",
  usage: "!cia <your question>",

  async execute(message, args) {
    try {
      // Check rate limiting
      if (
        rateLimiter.isRateLimited(message.author.id, "ai", config.rateLimits.ai)
      ) {
        const timeLeft = Math.ceil(
          rateLimiter.getTimeUntilReset(
            message.author.id,
            "ai",
            config.rateLimits.ai
          ) / 1000
        );
        return message.reply(
          `Rate limit exceeded. Please wait ${timeLeft} seconds before using AI commands again.`
        );
      }

      const question = args.join(" ");

      // Validate input
      if (!question) {
        return message.reply(
          "Please provide a question. Example: `!cia What is artificial intelligence?`"
        );
      }

      if (!Validator.isValidPrompt(question)) {
        return message.reply(
          `Please provide a valid question (max ${config.apis.gemini.maxPromptLength} characters).`
        );
      }

      // Send thinking message
      const thinkingMsg = await message.reply(
        "Analyzing... Please wait while I process your query."
      );

      try {
        // Get response from CIA AI
        const reply = await geminiService.askGemini(
          message.author.id,
          message.channel.id,
          Validator.sanitizeInput(question)
        );

        await thinkingMsg.edit(reply);

        logger.command("cia", message.author.id, message.guild?.id, true);
      } catch (error) {
        logger.error("CIA command execution error", {
          error: error.message,
          userId: message.author.id,
          channelId: message.channel.id,
        });

        await thinkingMsg.edit(
          "I encountered an error while processing your request. Please try again later."
        );
        logger.command("cia", message.author.id, message.guild?.id, false);
      }
    } catch (error) {
      logger.error("CIA command error", {
        error: error.message,
        userId: message.author.id,
        channelId: message.channel.id,
      });

      message.reply("An unexpected error occurred. Please try again later.");
      logger.command("cia", message.author.id, message.guild?.id, false);
    }
  },
};
