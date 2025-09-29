/**
 * Hugging Face AI command with enhanced error handling and rate limiting
 */
const hfService = require("../../ai/hf");
const rateLimiter = require("../../utils/rateLimiter");
const config = require("../../config");
const logger = require("../../utils/logger");
const Validator = require("../../utils/validator");

module.exports = {
  name: "hf",
  description: "Ask questions to Hugging Face's open-source AI models",
  category: "AI",
  usage: "!hf <your question>",

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
          "Please provide a question. Example: `!hf What is natural language processing?`"
        );
      }

      if (!Validator.isValidPrompt(question)) {
        return message.reply(
          `Please provide a valid question (max ${config.apis.gemini.maxPromptLength} characters).`
        );
      }

      // Send thinking message
      const thinkingMsg = await message.reply(
        "Processing with Llama model... This might take a moment."
      );

      try {
        // Get response from Hugging Face
        const reply = await hfService.askHF(Validator.sanitizeInput(question));
        await thinkingMsg.edit(reply);

        logger.command("hf", message.author.id, message.guild?.id, true);
      } catch (error) {
        logger.error("HF command execution error", {
          error: error.message,
          userId: message.author.id,
          channelId: message.channel.id,
        });

        await thinkingMsg.edit(
          "I encountered an error while processing your request. Please try again later."
        );
        logger.command("hf", message.author.id, message.guild?.id, false);
      }
    } catch (error) {
      logger.error("HF command error", {
        error: error.message,
        userId: message.author.id,
        channelId: message.channel.id,
      });

      message.reply("An unexpected error occurred. Please try again later.");
      logger.command("hf", message.author.id, message.guild?.id, false);
    }
  },
};
