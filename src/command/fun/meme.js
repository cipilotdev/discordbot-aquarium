/**
 * Enhanced meme command with better error handling
 */
const config = require("../../config");
const logger = require("../../utils/logger");
const rateLimiter = require("../../utils/rateLimiter");

module.exports = {
  name: "meme",
  description: "Get a random meme from the internet",
  category: "Fun",
  usage: "!meme",

  async execute(message) {
    try {
      // Check rate limiting
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
          `Please wait ${timeLeft} seconds before requesting another meme.`
        );
      }

      // Send loading message
      const loadingMsg = await message.reply("Fetching a fresh meme...");

      try {
        const response = await fetch(config.apis.meme.url, {
          method: "GET",
          headers: {
            "User-Agent": "Discord Bot Aquarium/1.0",
          },
          timeout: 10000, // 10 second timeout
        });

        if (!response.ok) {
          throw new Error(`Meme API returned status ${response.status}`);
        }

        const data = await response.json();

        if (!data || !data.url) {
          throw new Error("Invalid response format from meme API");
        }

        // Validate the meme data
        if (!data.title || !data.subreddit) {
          throw new Error("Incomplete meme data received");
        }

        await loadingMsg.delete();

        await message.channel.send({
          content: `**${data.title}**\nFrom r/${data.subreddit}`,
          files: [data.url],
        });

        logger.command("meme", message.author.id, message.guild?.id, true);
        logger.info("Meme delivered successfully", {
          userId: message.author.id,
          subreddit: data.subreddit,
          title: data.title,
        });
      } catch (apiError) {
        logger.error("Meme API error", {
          error: apiError.message,
          userId: message.author.id,
        });

        await loadingMsg.edit(
          "Sorry, I couldn't fetch a meme right now. The meme service might be temporarily unavailable."
        );
        logger.command("meme", message.author.id, message.guild?.id, false);
      }
    } catch (error) {
      logger.error("Meme command error", {
        error: error.message,
        userId: message.author.id,
        channelId: message.channel.id,
      });

      message.reply(
        "An unexpected error occurred while fetching a meme. Please try again later."
      );
      logger.command("meme", message.author.id, message.guild?.id, false);
    }
  },
};
