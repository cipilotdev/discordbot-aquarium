const { GoogleGenAI } = require("@google/genai");
const config = require("../config");
const logger = require("../utils/logger");
const Validator = require("../utils/validator");
const database = require("../services/database");
const fs = require("fs");
const path = require("path");

class CIAImageService {
  constructor() {
    this.client = new GoogleGenAI({
      apiKey: config.apis.gemini_images.key,
    });
    this.model = config.apis.gemini_images.model;
    this.maxRetries = config.apis.gemini_images.maxRetries;
  }

  async generateImage(userId, channelId, prompt) {
    // Validate input
    if (!Validator.isValidPrompt(prompt)) {
      throw new Error("Invalid prompt provided");
    }

    if (!Validator.isValidDiscordId(userId)) {
      throw new Error("Invalid user ID provided");
    }

    try {
      // Save user message to database
      await database.saveMessage(userId, channelId, prompt, "user");

      // Generate image with retry logic
      const imageBuffer = await this.generateImageWithRetry(prompt);

      // Save AI response to database
      await database.saveMessage(
        userId,
        channelId,
        "Generated image",
        "assistant"
      );

      logger.info("CIA image generated successfully", {
        userId,
        channelId,
        promptLength: prompt.length,
        imageSize: imageBuffer.length,
      });

      return imageBuffer;
    } catch (error) {
      logger.error("CIA image service error", {
        error: error.message,
        userId,
        channelId,
        promptLength: prompt.length,
      });
      throw new Error("Failed to generate image");
    }
  }

  async generateImageWithRetry(prompt) {
    let attempts = 0;
    while (attempts < this.maxRetries) {
      try {
        logger.debug(
          `CIA Image API attempt ${attempts + 1}/${this.maxRetries}`,
          {
            prompt: prompt.substring(0, 100) + "...",
          }
        );

        const response = await this.client.models.generateContent({
          model: this.model,
          contents: [prompt],
        });

        if (
          !response ||
          !response.candidates ||
          response.candidates.length === 0
        ) {
          throw new Error("No response candidates received from Gemini API");
        }

        const candidate = response.candidates[0];
        if (!candidate.content || !candidate.content.parts) {
          throw new Error("No content parts in response");
        }

        // Look for inline image data
        for (const part of candidate.content.parts) {
          if (part.inline_data && part.inline_data.data) {
            // Convert base64 to buffer
            const imageBuffer = Buffer.from(part.inline_data.data, "base64");
            return imageBuffer;
          }
        }

        throw new Error("No image data found in response");
      } catch (error) {
        attempts++;
        logger.warn("Image generation attempt failed", {
          attempt: attempts,
          error: error.message,
        });

        if (attempts >= this.maxRetries) {
          throw new Error(
            `Max retries reached for image generation: ${error.message}`
          );
        }

        // Wait before retry (exponential backoff)
        const delay = Math.pow(2, attempts) * 1000; // 2s, 4s, 8s
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  async healthCheck() {
    try {
      const response = await this.client.models.generateContent({
        model: this.model,
        contents: ["A simple test image"],
      });

      return !!response.candidates;
    } catch (error) {
      logger.error("CIA Image health check failed", { error: error.message });
      return false;
    }
  }
}

module.exports = new CIAImageService();
