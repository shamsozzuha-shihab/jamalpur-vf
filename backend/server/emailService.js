const nodemailer = require("nodemailer");
const https = require("https");

class EmailService {
  constructor() {
    this.initializeServices();
  }

  initializeServices() {
    // Initialize Brevo (formerly Sendinblue) - Primary Email Service
    if (process.env.BREVO_API_KEY) {
      this.brevoEnabled = true;
      this.brevoApiKey = process.env.BREVO_API_KEY;
      console.log("✅ Brevo email service initialized");
    } else {
      console.log("⚠️ BREVO_API_KEY not found, email service disabled");
    }
  }

  // Send email using Brevo API
  async sendEmailBrevo(to, subject, htmlContent, textContent = "") {
    if (!this.brevoEnabled) {
      throw new Error("Brevo service not initialized");
    }

    const emailData = {
      sender: {
        name: "Jamalpur Chamber of Commerce",
        email: "noreply@thejamalpurchamberofcommerce.com",
      },
      to: Array.isArray(to) ? to : [{ email: to }],
      subject: subject,
      htmlContent: htmlContent,
      textContent: textContent,
    };

    return new Promise((resolve, reject) => {
      const postData = JSON.stringify(emailData);

      const options = {
        hostname: "api.brevo.com",
        port: 443,
        path: "/v3/smtp/email",
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(postData),
          "api-key": this.brevoApiKey,
        },
      };

      const req = https.request(options, (res) => {
        let data = "";
        res.on("data", (chunk) => {
          data += chunk;
        });

        res.on("end", () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            console.log("✅ Email sent successfully via Brevo");
            resolve({ success: true, messageId: JSON.parse(data).messageId });
          } else {
            console.error("❌ Brevo API error:", res.statusCode, data);
            reject(new Error(`Brevo API error: ${res.statusCode} - ${data}`));
          }
        });
      });

      req.on("error", (error) => {
        console.error("❌ Brevo request error:", error);
        reject(error);
      });

      req.write(postData);
      req.end();
    });
  }

  // Main email sending method
  async sendEmail(to, subject, htmlContent, textContent = "") {
    try {
      if (this.brevoEnabled) {
        return await this.sendEmailBrevo(to, subject, htmlContent, textContent);
      } else {
        throw new Error("No email service available");
      }
    } catch (error) {
      console.error("❌ Email sending failed:", error);
      throw error;
    }
  }

  // Send OTP email
  async sendOTPEmail(email, otp) {
    const subject = "Your OTP for Jamalpur Chamber of Commerce";
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2c3e50;">Jamalpur Chamber of Commerce & Industry</h2>
        <p>Your One-Time Password (OTP) is:</p>
        <div style="background-color: #f8f9fa; padding: 20px; text-align: center; margin: 20px 0;">
          <h1 style="color: #e74c3c; font-size: 32px; margin: 0;">${otp}</h1>
        </div>
        <p>This OTP is valid for 10 minutes. Please do not share it with anyone.</p>
        <p>If you didn't request this OTP, please ignore this email.</p>
        <hr style="margin: 30px 0;">
        <p style="color: #7f8c8d; font-size: 12px;">
          Jamalpur Chamber of Commerce & Industry<br>
          Accelerating the Trillion Dollar Journey
        </p>
      </div>
    `;

    const textContent = `Your OTP for Jamalpur Chamber of Commerce is: ${otp}. This OTP is valid for 10 minutes.`;

    return await this.sendEmail(email, subject, htmlContent, textContent);
  }

  // Send welcome email
  async sendWelcomeEmail(email, name) {
    const subject = "Welcome to Jamalpur Chamber of Commerce & Industry";
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2c3e50;">Welcome to Jamalpur Chamber of Commerce & Industry</h2>
        <p>Dear ${name},</p>
        <p>Welcome to the Jamalpur Chamber of Commerce & Industry! We're excited to have you as a member of our community.</p>
        <p>Your account has been successfully created and you can now access all our services.</p>
        <p>If you have any questions, please don't hesitate to contact us.</p>
        <hr style="margin: 30px 0;">
        <p style="color: #7f8c8d; font-size: 12px;">
          Jamalpur Chamber of Commerce & Industry<br>
          Accelerating the Trillion Dollar Journey
        </p>
      </div>
    `;

    const textContent = `Welcome to Jamalpur Chamber of Commerce & Industry, ${name}! Your account has been successfully created.`;

    return await this.sendEmail(email, subject, htmlContent, textContent);
  }

  // Send password reset email
  async sendPasswordResetEmail(email, resetToken) {
    const resetUrl = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;
    const subject = "Password Reset - Jamalpur Chamber of Commerce";
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2c3e50;">Password Reset Request</h2>
        <p>You have requested to reset your password for your Jamalpur Chamber of Commerce account.</p>
        <p>Click the button below to reset your password:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" style="background-color: #3498db; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">Reset Password</a>
        </div>
        <p>If the button doesn't work, copy and paste this link into your browser:</p>
        <p style="word-break: break-all; color: #3498db;">${resetUrl}</p>
        <p>This link will expire in 1 hour for security reasons.</p>
        <p>If you didn't request this password reset, please ignore this email.</p>
        <hr style="margin: 30px 0;">
        <p style="color: #7f8c8d; font-size: 12px;">
          Jamalpur Chamber of Commerce & Industry<br>
          Accelerating the Trillion Dollar Journey
        </p>
      </div>
    `;

    const textContent = `Password Reset Request for Jamalpur Chamber of Commerce. Click here to reset: ${resetUrl}`;

    return await this.sendEmail(email, subject, htmlContent, textContent);
  }
}

module.exports = new EmailService();
