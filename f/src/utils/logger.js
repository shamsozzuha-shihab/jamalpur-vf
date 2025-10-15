// Production-safe console logger
// Automatically disables logs in production builds

const isDevelopment = process.env.NODE_ENV === 'development';

class Logger {
  constructor() {
    this.enabled = isDevelopment;
  }

  log(...args) {
    if (this.enabled) {
      console.log(...args);
    }
  }

  info(...args) {
    if (this.enabled) {
      console.info(...args);
    }
  }

  warn(...args) {
    // Always show warnings
    console.warn(...args);
  }

  error(...args) {
    // Always show errors
    console.error(...args);
  }

  debug(...args) {
    if (this.enabled) {
      console.debug(...args);
    }
  }

  group(label) {
    if (this.enabled && console.group) {
      console.group(label);
    }
  }

  groupEnd() {
    if (this.enabled && console.groupEnd) {
      console.groupEnd();
    }
  }

  table(data) {
    if (this.enabled && console.table) {
      console.table(data);
    }
  }

  time(label) {
    if (this.enabled && console.time) {
      console.time(label);
    }
  }

  timeEnd(label) {
    if (this.enabled && console.timeEnd) {
      console.timeEnd(label);
    }
  }

  // Toggle logging (useful for debugging in production)
  enable() {
    this.enabled = true;
  }

  disable() {
    this.enabled = false;
  }
}

// Export singleton instance
const logger = new Logger();
export default logger;

// For convenience, also export individual methods
export const { log, info, warn, error, debug, group, groupEnd, table, time, timeEnd } = logger;

