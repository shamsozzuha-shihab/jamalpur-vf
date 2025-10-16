// Keepalive service to prevent Render from sleeping
const https = require("https");

class KeepAliveService {
  constructor() {
    this.interval = null;
    this.isRunning = false;
  }

  start() {
    if (this.isRunning) return;

    console.log("🔄 Starting keepalive service...");

    // Ping every 10 minutes (600000 ms)
    this.interval = setInterval(() => {
      this.pingSelf();
    }, 600000); // 10 minutes

    this.isRunning = true;
    console.log("✅ Keepalive service started");
  }

  stop() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
    this.isRunning = false;
    console.log("⏹️ Keepalive service stopped");
  }

  pingSelf() {
    const url =
      process.env.FRONTEND_URL || "https://thejamalpurchamberofcommerce.com";

    // Make a simple request to keep the service awake
    const options = {
      hostname: "jamalpur-chamber-backend.onrender.com",
      port: 443,
      path: "/health",
      method: "GET",
      timeout: 5000,
    };

    const req = https.request(options, (res) => {
      console.log(`🔄 Keepalive ping: ${res.statusCode}`);
    });

    req.on("error", (error) => {
      console.log("⚠️ Keepalive ping failed:", error.message);
    });

    req.on("timeout", () => {
      req.destroy();
      console.log("⚠️ Keepalive ping timeout");
    });

    req.end();
  }
}

module.exports = new KeepAliveService();
