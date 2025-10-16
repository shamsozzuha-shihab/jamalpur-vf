// Simple rate limiting middleware
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minutes
const MAX_REQUESTS = 100; // Max requests per window

const rateLimiter = (windowMs = RATE_LIMIT_WINDOW, maxRequests = MAX_REQUESTS) => {
  return (req, res, next) => {
    const clientId = req.ip || req.connection.remoteAddress;
    const now = Date.now();
    
    // Clean up old entries
    for (const [ip, data] of rateLimitMap.entries()) {
      if (now - data.firstRequest > windowMs) {
        rateLimitMap.delete(ip);
      }
    }
    
    const clientData = rateLimitMap.get(clientId);
    
    if (!clientData) {
      // First request from this client
      rateLimitMap.set(clientId, {
        count: 1,
        firstRequest: now
      });
      return next();
    }
    
    if (now - clientData.firstRequest > windowMs) {
      // Window expired, reset
      rateLimitMap.set(clientId, {
        count: 1,
        firstRequest: now
      });
      return next();
    }
    
    if (clientData.count >= maxRequests) {
      return res.status(429).json({
        message: 'Too many requests, please try again later',
        retryAfter: Math.ceil((clientData.firstRequest + windowMs - now) / 1000)
      });
    }
    
    // Increment count
    clientData.count++;
    next();
  };
};

// Stricter rate limiting for auth endpoints
const authRateLimiter = rateLimiter(15 * 60 * 1000, 5); // 5 requests per 15 minutes

module.exports = { rateLimiter, authRateLimiter };
