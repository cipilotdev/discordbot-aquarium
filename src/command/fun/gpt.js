/**
 * GPT AI command with enhanced error handling and rate limiting
 */
const gptService = require("../../ai/gpt");
const rateLimiter = require("../../utils/rateLimiter");
const config = require("../../config");
const logger = require("../../utils/logger");
const Validator = require("../../utils/validator");

module.exports = {
  name: "gpt",
  description: "Ask questions to OpenAI's GPT",
  category: "AI",
  usage: "!gpt <your question>",

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
          "Please provide a question. Example: `!gpt What is machine learning?`"
        );
      }

      if (!Validator.isValidPrompt(question)) {
        return message.reply(
          `Please provide a valid question (max ${config.apis.gemini.maxPromptLength} characters).`
        );
      }

      // Send thinking message
      const thinkingMsg = await message.reply(
        "Processing your question... Please wait."
      );

      try {
        // Get response from GPT
        const reply = await gptService.askGPT(
          Validator.sanitizeInput(question)
        );
        await thinkingMsg.edit(reply);

        logger.command("gpt", message.author.id, message.guild?.id, true);
      } catch (error) {
        logger.error("GPT command execution error", {
          error: error.message,
          userId: message.author.id,
          channelId: message.channel.id,
        });

        await thinkingMsg.edit(
          "I encountered an error while processing your request. Please try again later."
        );
        logger.command("gpt", message.author.id, message.guild?.id, false);
      }
    } catch (error) {
      logger.error("GPT command error", {
        error: error.message,
        userId: message.author.id,
        channelId: message.channel.id,
      });

      message.reply("An unexpected error occurred. Please try again later.");
      logger.command("gpt", message.author.id, message.guild?.id, false);
    }
  },
};
