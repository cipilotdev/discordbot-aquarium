/**
 * CIA Image Generation command with enhanced error handling and rate limiting
 */
const ciaImageService = require("../../ai/cia-image");
const rateLimiter = require("../../utils/rateLimiter");
const config = require("../../config");
const logger = require("../../utils/logger");
const Validator = require("../../utils/validator");
const { AttachmentBuilder } = require("discord.js");

module.exports = {
  name: "cia-image",
  description: "Generate images using CIA's advanced AI system",
  category: "AI",
  usage: "!cia-image <your image description>",
  aliases: ["prompt", "img"],

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

      const prompt = args.join(" ");

      // Validate input
      if (!prompt) {
        return message.reply(
          "Please provide an image description. Example: `!cia-image A beautiful sunset over mountains`"
        );
      }

      if (!Validator.isValidPrompt(prompt)) {
        return message.reply(
          `Please provide a valid image description (max ${config.apis.gemini.maxPromptLength} characters).`
        );
      }

      // Send thinking message
      const thinkingMsg = await message.reply(
        "Generating your image... This may take a moment."
      );

      try {
        // Get image from CIA Image AI
        const imageBuffer = await ciaImageService.generateImage(
          message.author.id,
          message.channel.id,
          Validator.sanitizeInput(prompt)
        );

        // Create Discord attachment
        const attachment = new AttachmentBuilder(imageBuffer, {
          name: "cia-generated-image.png",
          description: `Generated image: ${prompt.substring(0, 100)}${
            prompt.length > 100 ? "..." : ""
          }`,
        });

        // Edit the thinking message to include the image
        await thinkingMsg.edit({
          content: `**Generated Image**\n*Prompt:* ${prompt}`,
          files: [attachment],
        });

        logger.command("cia-image", message.author.id, message.guild?.id, true);
      } catch (error) {
        logger.error("CIA Image command execution error", {
          error: error.message,
          userId: message.author.id,
          channelId: message.channel.id,
        });

        let errorMessage =
          "I encountered an error while generating your image. Please try again later.";

        if (
          error.message.includes("quota") ||
          error.message.includes("429") ||
          error.message.includes("RESOURCE_EXHAUSTED")
        ) {
          errorMessage =
            "**Quota Exceeded**\nThe Gemini API quota has been reached. Please try again later or check your API billing settings.\n\n*The image generation feature is working correctly - this is just a quota limit.*";
        } else if (
          error.message.includes("503") ||
          error.message.includes("Service Unavailable")
        ) {
          errorMessage =
            "CIA Image service is temporarily unavailable. Please try again later.";
        } else if (error.message.includes("Invalid prompt")) {
          errorMessage =
            "Your prompt contains content that cannot be processed. Please try a different description.";
        }

        await thinkingMsg.edit(errorMessage);
        logger.command(
          "cia-image",
          message.author.id,
          message.guild?.id,
          false
        );
      }
    } catch (error) {
      logger.error("CIA Image command error", {
        error: error.message,
        userId: message.author.id,
        channelId: message.channel.id,
      });

      message.reply("An unexpected error occurred. Please try again later.");
      logger.command("cia-image", message.author.id, message.guild?.id, false);
    }
  },
};
