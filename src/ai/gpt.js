/**
 * Enhanced OpenAI GPT service with improved error handling
 */
const OpenAI = require("openai");
const config = require("../config");
const logger = require("../utils/logger");
const Validator = require("../utils/validator");

class GPTService {
  constructor() {
    this.client = new OpenAI({
      apiKey: config.apis.openai.key,
    });
    this.model = config.apis.openai.model;
    this.maxTokens = config.apis.openai.maxTokens;
  }

  async askGPT(prompt) {
    // Validate input
    if (!Validator.isValidPrompt(prompt)) {
      throw new Error("Invalid prompt provided");
    }

    try {
      logger.debug("Sending request to OpenAI GPT", {
        model: this.model,
        promptLength: prompt.length,
      });

      const response = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: "system",
            content:
              "You are a helpful Discord bot assistant. Provide concise, helpful responses without excessive formatting.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        max_tokens: this.maxTokens,
        temperature: 0.7,
      });

      if (!response.choices || response.choices.length === 0) {
        throw new Error("No response choices received from OpenAI");
      }

      const result = response.choices[0].message.content.trim();

      logger.info("GPT response generated successfully", {
        promptLength: prompt.length,
        responseLength: result.length,
        tokensUsed: response.usage?.total_tokens || 0,
      });

      return Validator.truncateMessage(result);
    } catch (error) {
      logger.error("GPT service error", {
        error: error.message,
        promptLength: prompt.length,
      });

      if (error.code === "insufficient_quota") {
        return "OpenAI API quota exceeded. Please try again later.";
      }

      if (error.code === "rate_limit_exceeded") {
        return "Rate limit exceeded. Please try again in a moment.";
      }

      if (error.message.includes("timeout")) {
        return "Request timed out. Please try again.";
      }

      return "I encountered an error while processing your request. Please try again.";
    }
  }

  async healthCheck() {
    try {
      const response = await this.client.chat.completions.create({
        model: this.model,
        messages: [{ role: "user", content: "Hello" }],
        max_tokens: 10,
      });

      return !!response.choices?.[0]?.message?.content;
    } catch (error) {
      logger.error("GPT health check failed", { error: error.message });
      return false;
    }
  }
}

module.exports = new GPTService();
