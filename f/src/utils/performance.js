// Performance monitoring utilities
export const performanceMonitor = {
  // Measure component render time
  measureRender: (componentName) => {
    const start = performance.now();
    return () => {
      const end = performance.now();
      const duration = end - start;
      console.log(`🎯 ${componentName} render time: ${duration.toFixed(2)}ms`);
      return duration;
    };
  },

  // Measure API call performance
  measureApiCall: async (apiCall, endpoint) => {
    const start = performance.now();
    try {
      const result = await apiCall();
      const end = performance.now();
      const duration = end - start;
      console.log(`🌐 API ${endpoint} call time: ${duration.toFixed(2)}ms`);
      return result;
    } catch (error) {
      const end = performance.now();
      const duration = end - start;
      console.log(`❌ API ${endpoint} failed after: ${duration.toFixed(2)}ms`);
      throw error;
    }
  },

  // Measure function execution time
  measureFunction: (fn, functionName) => {
    return async (...args) => {
      const start = performance.now();
      try {
        const result = await fn(...args);
        const end = performance.now();
        const duration = end - start;
        console.log(`⚡ ${functionName} execution time: ${duration.toFixed(2)}ms`);
        return result;
      } catch (error) {
        const end = performance.now();
        const duration = end - start;
        console.log(`❌ ${functionName} failed after: ${duration.toFixed(2)}ms`);
        throw error;
      }
    };
  },

  // Get memory usage (if available)
  getMemoryUsage: () => {
    if (performance.memory) {
      return {
        used: Math.round(performance.memory.usedJSHeapSize / 1048576 * 100) / 100,
        total: Math.round(performance.memory.totalJSHeapSize / 1048576 * 100) / 100,
        limit: Math.round(performance.memory.jsHeapSizeLimit / 1048576 * 100) / 100
      };
    }
    return null;
  },

  // Log performance metrics
  logMetrics: () => {
    const memory = performanceMonitor.getMemoryUsage();
    if (memory) {
      console.log(`📊 Memory Usage: ${memory.used}MB / ${memory.total}MB (Limit: ${memory.limit}MB)`);
    }
  }
};

// Web Vitals monitoring
export const reportWebVitals = (onPerfEntry) => {
  if (onPerfEntry && onPerfEntry instanceof Function) {
    import('web-vitals').then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
      getCLS(onPerfEntry);
      getFID(onPerfEntry);
      getFCP(onPerfEntry);
      getLCP(onPerfEntry);
      getTTFB(onPerfEntry);
    });
  }
};
