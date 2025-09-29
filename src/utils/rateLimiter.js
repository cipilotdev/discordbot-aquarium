/**
 * Rate limiting utility
 */
class RateLimiter {
  constructor() {
    this.users = new Map();
    this.commands = new Map();
  }

  isRateLimited(userId, commandType = "general", limits) {
    const now = Date.now();
    const key = `${userId}-${commandType}`;

    if (!this.users.has(key)) {
      this.users.set(key, { requests: [], windowStart: now });
      return false;
    }

    const userData = this.users.get(key);

    // Clean old requests outside the window
    userData.requests = userData.requests.filter(
      (timestamp) => now - timestamp < limits.windowMs
    );

    // Check if limit exceeded
    if (userData.requests.length >= limits.maxRequests) {
      return true;
    }

    // Add current request
    userData.requests.push(now);
    return false;
  }

  getRemainingRequests(userId, commandType = "general", limits) {
    const key = `${userId}-${commandType}`;
    const userData = this.users.get(key);

    if (!userData) return limits.maxRequests;

    const now = Date.now();
    const validRequests = userData.requests.filter(
      (timestamp) => now - timestamp < limits.windowMs
    );

    return Math.max(0, limits.maxRequests - validRequests.length);
  }

  getTimeUntilReset(userId, commandType = "general", limits) {
    const key = `${userId}-${commandType}`;
    const userData = this.users.get(key);

    if (!userData || userData.requests.length === 0) return 0;

    const oldestRequest = Math.min(...userData.requests);
    const resetTime = oldestRequest + limits.windowMs;
    const now = Date.now();

    return Math.max(0, resetTime - now);
  }

  // Clean up old entries to prevent memory leaks
  cleanup() {
    const now = Date.now();
    const maxAge = 3600000; // 1 hour

    for (const [key, userData] of this.users.entries()) {
      if (
        userData.requests.length === 0 ||
        now - userData.requests[userData.requests.length - 1] > maxAge
      ) {
        this.users.delete(key);
      }
    }
  }
}

module.exports = new RateLimiter();
