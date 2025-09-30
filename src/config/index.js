/**
 * Configuration management for Discord bot
 */
require("dotenv").config();

const config = {
  // Discord configuration
  discord: {
    token: process.env.DISCORD_BOT_TOKEN,
    prefix: "!",
    maxMessageLength: 2000,
    embedColor: 0x5865f2,
  },

  // API configurations
  apis: {
    gemini: {
      key: process.env.GEMINI_API_KEY,
      model: "gemini-2.5-flash",
      maxPromptLength: 1000,
      maxRetries: 3,
    },
    openai: {
      key: process.env.OPENAI_API_KEY,
      model: "gpt-3.5-turbo",
      maxTokens: 1500,
    },
    huggingface: {
      key: process.env.HF_API_KEY,
      model: "meta-llama/Meta-Llama-3-8B-Instruct",
      endpoint: "https://api-inference.huggingface.co/models",
    },
    meme: {
      url: process.env.MEME_API_URL,
    },
  },

  // Database configuration
  database: {
    supabase: {
      url: process.env.SUPABASE_URL,
      serviceKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
      anonKey: process.env.SUPABASE_ANON_KEY,
    },
  },

  // Rate limiting
  rateLimits: {
    ai: {
      windowMs: 60000, // 1 minute
      maxRequests: 10,
    },
    general: {
      windowMs: 5000, // 5 seconds
      maxRequests: 5,
    },
  },

  // Game settings
  games: {
    tictactoe: {
      gridSize: 3,
      timeout: 300000, // 5 minutes
      symbols: {
        player1: "X",
        player2: "O",
        empty: "-",
      },
    },
  },
};

module.exports = config;
