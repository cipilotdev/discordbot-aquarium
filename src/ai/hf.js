/**
 * Enhanced Hugging Face service with improved error handling
 */
const config = require("../config");
const logger = require("../utils/logger");
const Validator = require("../utils/validator");

class HuggingFaceService {
  constructor() {
    this.apiKey = config.apis.huggingface.key;
    this.model = config.apis.huggingface.model;
    this.endpoint = `${config.apis.huggingface.endpoint}/${this.model}`;
  }

  async askHF(prompt) {
    // Validate input
    if (!Validator.isValidPrompt(prompt)) {
      throw new Error("Invalid prompt provided");
    }

    try {
      logger.debug("Sending request to Hugging Face", {
        model: this.model,
        promptLength: prompt.length,
      });

      const response = await fetch(this.endpoint, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          inputs: prompt,
          parameters: {
            max_new_tokens: 500,
            temperature: 0.7,
            do_sample: true,
          },
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HF API Error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();

      if (!Array.isArray(data) || data.length === 0) {
        throw new Error("Invalid response format from Hugging Face API");
      }

      const result = data[0]?.generated_text;

      if (!result) {
        throw new Error("No generated text in response");
      }

      // Remove the original prompt from the response if it's included
      const cleanResult = result.replace(prompt, "").trim();
      const finalResult = cleanResult || result;

      logger.info("HF response generated successfully", {
        promptLength: prompt.length,
        responseLength: finalResult.length,
      });

      return Validator.truncateMessage(finalResult);
    } catch (error) {
      logger.error("Hugging Face service error", {
        error: error.message,
        promptLength: prompt.length,
      });

      if (error.message.includes("503")) {
        return "Hugging Face service is temporarily unavailable. Please try again later.";
      }

      if (
        error.message.includes("rate limit") ||
        error.message.includes("429")
      ) {
        return "Rate limit exceeded. Please try again later.";
      }

      if (error.message.includes("timeout")) {
        return "Request timed out. Please try again.";
      }

      return "I encountered an error while processing your request. Please try again.";
    }
  }

  async healthCheck() {
    try {
      const response = await fetch(this.endpoint, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          inputs: "Hello",
          parameters: { max_new_tokens: 10 },
        }),
      });

      return response.ok;
    } catch (error) {
      logger.error("HF health check failed", { error: error.message });
      return false;
    }
  }
}

module.exports = new HuggingFaceService();
