/**
 * Enhanced database service with connection pooling and error handling
 */
const { createClient } = require("@supabase/supabase-js");
const config = require("../config");
const logger = require("../utils/logger");

class DatabaseService {
  constructor() {
    this.supabase = createClient(
      config.database.supabase.url,
      config.database.supabase.serviceKey,
      {
        auth: {
          persistSession: false,
        },
        db: {
          schema: "public",
        },
        global: {
          headers: { "x-my-custom-header": "discord-bot" },
        },
      }
    );

    this.connectionPool = new Map();
    this.queryCache = new Map();
    this.cacheTimeout = 300000; // 5 minutes
  }

  async saveMessage(userId, channelId, message, role = "user") {
    try {
      const { data, error } = await this.supabase
        .from("conversations")
        .insert([
          {
            user_id: userId,
            channel_id: channelId,
            message: message,
            role: role,
            created_at: new Date().toISOString(),
          },
        ])
        .select();

      if (error) {
        logger.error("Failed to save message to database", {
          error: error.message,
          userId,
          channelId,
        });
        return null;
      }

      logger.debug("Message saved to database", {
        userId,
        channelId,
        messageId: data[0]?.id,
      });
      return data[0];
    } catch (err) {
      logger.error("Database connection error when saving message", {
        error: err.message,
        userId,
        channelId,
      });
      return null;
    }
  }

  async getMessages(userId, channelId, limit = 10) {
    const cacheKey = `messages-${userId}-${channelId}-${limit}`;

    // Check cache first
    if (this.queryCache.has(cacheKey)) {
      const cached = this.queryCache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheTimeout) {
        logger.debug("Returning cached messages", {
          userId,
          channelId,
          count: cached.data.length,
        });
        return cached.data;
      }
      this.queryCache.delete(cacheKey);
    }

    try {
      const { data, error } = await this.supabase
        .from("conversations")
        .select("message, role, created_at")
        .eq("user_id", userId)
        .eq("channel_id", channelId)
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error) {
        logger.error("Failed to retrieve messages from database", {
          error: error.message,
          userId,
          channelId,
        });
        return [];
      }

      const messages = data ? data.map((row) => row.message).reverse() : [];

      // Cache the result
      this.queryCache.set(cacheKey, {
        data: messages,
        timestamp: Date.now(),
      });

      logger.debug("Messages retrieved from database", {
        userId,
        channelId,
        count: messages.length,
      });
      return messages;
    } catch (err) {
      logger.error("Database connection error when retrieving messages", {
        error: err.message,
        userId,
        channelId,
      });
      return [];
    }
  }

  async getConversationHistory(userId, channelId, limit = 20) {
    try {
      const { data, error } = await this.supabase
        .from("conversations")
        .select("message, role, created_at")
        .eq("user_id", userId)
        .eq("channel_id", channelId)
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error) {
        logger.error("Failed to retrieve conversation history", {
          error: error.message,
          userId,
          channelId,
        });
        return [];
      }

      return data ? data.reverse() : [];
    } catch (err) {
      logger.error(
        "Database connection error when retrieving conversation history",
        {
          error: err.message,
          userId,
          channelId,
        }
      );
      return [];
    }
  }

  async clearCache() {
    this.queryCache.clear();
    logger.info("Database query cache cleared");
  }

  async healthCheck() {
    try {
      const { data, error } = await this.supabase
        .from("conversations")
        .select("count")
        .limit(1);

      return !error;
    } catch (err) {
      logger.error("Database health check failed", { error: err.message });
      return false;
    }
  }

  // Clean up old cache entries
  cleanupCache() {
    const now = Date.now();
    for (const [key, value] of this.queryCache.entries()) {
      if (now - value.timestamp > this.cacheTimeout) {
        this.queryCache.delete(key);
      }
    }
  }
}

module.exports = new DatabaseService();
