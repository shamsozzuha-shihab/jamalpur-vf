// Simple in-memory cache for API responses
const cache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

const cacheMiddleware = (duration = CACHE_DURATION) => {
  return (req, res, next) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }

    const key = `${req.originalUrl}`;
    const cached = cache.get(key);

    if (cached && Date.now() - cached.timestamp < duration) {
      console.log(`📦 Cache hit for: ${key}`);
      return res.json(cached.data);
    }

    // Store original res.json
    const originalJson = res.json;
    
    // Override res.json to cache the response
    res.json = function(data) {
      cache.set(key, {
        data: data,
        timestamp: Date.now()
      });
      
      // Clean up old cache entries periodically
      if (cache.size > 100) {
        const now = Date.now();
        for (const [k, v] of cache.entries()) {
          if (now - v.timestamp > duration) {
            cache.delete(k);
          }
        }
      }
      
      return originalJson.call(this, data);
    };

    next();
  };
};

// Clear cache for specific routes
const clearCache = (pattern) => {
  for (const key of cache.keys()) {
    if (key.includes(pattern)) {
      cache.delete(key);
      console.log(`🗑️ Cache cleared for: ${key}`);
    }
  }
};

module.exports = { cacheMiddleware, clearCache };
