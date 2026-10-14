export class RateLimiter {
  private maxRequests: number;
  private windowMs: number;
  private clients: Map<String, Array<number>>
  
  constructor(windowSec: number, maxRequests: number) {
    this.windowMs = Number(windowSec * 1000); // e.g., 60000 for 1 minute
    this.maxRequests = maxRequests;   // e.g., 20
    this.clients = new Map();         // key: clientId, value: [timestamp1, timestamp2, ...]
  }

  isAllowed(clientId: string) {
    const now = Date.now();
    const windowStart = now - this.windowMs;

    if (!this.clients.has(clientId)) {
      this.clients.set(clientId, [now]);
      return true;
    }

    // Keep only requests within the current window
    const timestamps = this.clients.get(clientId)!.filter(t => t > windowStart);

    if (timestamps && timestamps.length >= this.maxRequests) {
      this.clients.set(clientId, timestamps);
      return false; // Rate limit exceeded
    }

    timestamps.push(now);
    this.clients.set(clientId, timestamps);
    return true;
  }

  static generateRateLimitError(message: string) {
    return JSON.stringify({
        type: "ERROR",
        code: 429,
        message
    })
  }
}

export const connectionLimiter = new RateLimiter(60, 5); // 5 connections per minute per IP
export const messageLimiter = new RateLimiter(60, 120); // 120 messages per minute per IP