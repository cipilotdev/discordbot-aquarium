/**
 * Enhanced CIA AI service with improved error handling and rate limiting
 */
const { GoogleGenAI } = require("@google/genai");
const config = require("../config");
const logger = require("../utils/logger");
const Validator = require("../utils/validator");
const database = require("../services/database");

class CIAService {
  constructor() {
    this.ai = new GoogleGenAI({
      apiKey: config.apis.gemini.key,
    });
    this.model = config.apis.gemini.model;
    this.maxRetries = config.apis.gemini.maxRetries;
  }

  async askGemini(userId, channelId, prompt) {
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

      // Get conversation history
      const conversationHistory = await database.getConversationHistory(
        userId,
        channelId,
        10
      );

      // Prepare contents for CIA AI
      const contents = this.prepareContents(conversationHistory, prompt);

      // Generate response with retry logic
      const response = await this.generateWithRetry(contents);

      // Save AI response to database
      await database.saveMessage(userId, channelId, response, "assistant");

      logger.info("CIA response generated successfully", {
        userId,
        channelId,
        promptLength: prompt.length,
        responseLength: response.length,
      });

      return Validator.truncateMessage(response);
    } catch (error) {
      logger.error("CIA service error", {
        error: error.message,
        userId,
        channelId,
        promptLength: prompt.length,
      });

      if (
        error.message.includes("503") ||
        error.message.includes("Service Unavailable")
      ) {
        return "CIA service is temporarily unavailable. Please try again later.";
      }

      if (error.message.includes("quota")) {
        return "API quota exceeded. Please try again later.";
      }

      return "I encountered an error while processing your request. Please try again.";
    }
  }

  prepareContents(conversationHistory, currentPrompt) {
    const contents = [];

    // Add system message
    contents.push({
      type: "text",
      text: "You are a helpful Discord bot named Pak Cia assistant. Provide concise, helpful responses.",
    });

    // Add conversation history
    conversationHistory.forEach((msg) => {
      if (msg.message && msg.message.trim()) {
        contents.push({
          type: "text",
          text: `${msg.role}: ${msg.message}`,
        });
      }
    });

    // Add current prompt
    contents.push({
      type: "text",
      text: `user: ${currentPrompt}`,
    });

    return contents;
  }

  async generateWithRetry(contents) {
    let lastError;

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        logger.debug(`CIA API attempt ${attempt}/${this.maxRetries}`);

        const response = await this.ai.models.generateContent({
          model: this.model,
          contents,
          config: {
            thinkingConfig: {
              thinkingBudget: 5000,
            },
          },
        });

        if (!response || !response.text) {
          throw new Error("Empty response from CIA API");
        }

        return response.text.trim();
      } catch (error) {
        lastError = error;
        logger.warn(`CIA API attempt ${attempt} failed`, {
          error: error.message,
          attempt,
          maxRetries: this.maxRetries,
        });

        // Wait before retry (exponential backoff)
        if (attempt < this.maxRetries) {
          const delay = Math.pow(2, attempt) * 1000; // 2s, 4s, 8s
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError;
  }

  async healthCheck() {
    try {
      const response = await this.ai.models.generateContent({
        model: this.model,
        contents: [{ type: "text", text: "Hello" }],
      });

      return !!response.text;
    } catch (error) {
      logger.error("CIA health check failed", { error: error.message });
      return false;
    }
  }
}

module.exports = new CIAService();
