const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const compression = require("compression");
const { createServer } = require("http");
const { Server } = require("socket.io");

// Load environment variables
dotenv.config();

// Validate critical environment variables
const requiredEnvVars = [
  "MONGODB_URI",
  "JWT_SECRET",
  "CLOUDINARY_CLOUD_NAME",
  "CLOUDINARY_API_KEY",
  "CLOUDINARY_API_SECRET",
];
const missingEnvVars = requiredEnvVars.filter(
  (varName) => !process.env[varName]
);

if (missingEnvVars.length > 0) {
  console.error(
    "❌ Missing required environment variables:",
    missingEnvVars.join(", ")
  );
  process.exit(1);
}

console.log("✅ Environment variables validated");
console.log("🔧 Cloudinary configured for:", process.env.CLOUDINARY_CLOUD_NAME);

// Import email service after environment variables are loaded
const emailService = require("./emailService");

// Import image optimizer
const { optimizeUploadedImage } = require("./middleware/imageOptimizer");
const cloudinary = require("./config/cloudinary");

// Import keepalive service
const keepAliveService = require("./keepalive");

//https://project1-three-dun.vercel.app
const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  },
});
const PORT = process.env.PORT || 5000;

// Email service is now handled by emailService.js

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Middleware
app.use(compression({ level: 6, threshold: 1024 }));
app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Serve static files from uploads directory (fallback for existing files)
app.use(
  "/api/files",
  express.static(uploadsDir, {
    maxAge: "1d",
    etag: true,
    lastModified: true,
  })
);

// MongoDB Connection with Performance Optimizations
const MONGODB_URI = process.env.MONGODB_URI;

// Configure multer for file uploads (filesystem storage for now)
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(
      null,
      `${file.fieldname}-${uniqueSuffix}${path.extname(file.originalname)}`
    );
  },
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const allowed =
      file.mimetype === "application/pdf" || file.mimetype.startsWith("image/");
    if (!allowed) {
      return cb(new Error("Only PDF and image files are allowed"));
    }
    cb(null, true);
  },
  limits: { fileSize: 10 * 1024 * 1024 },
});

mongoose
  .connect(MONGODB_URI, {
    maxPoolSize: 10, // Maintain up to 10 socket connections
    serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
    socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
  })
  .then(() => {
    console.log("✅ MongoDB Connected Successfully");
  })
  .catch((err) => console.error("❌ MongoDB Connection Error:", err));

// MongoDB Schemas
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ["user", "admin"], default: "user" },
  resetPasswordToken: { type: String },
  resetPasswordExpires: { type: Date },
  createdAt: { type: Date, default: Date.now },
});

userSchema.index({ email: 1 });
userSchema.index({ resetPasswordToken: 1 });
userSchema.index({ createdAt: -1 });

const formSubmissionSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  message: { type: String, required: true },
  category: { type: String, default: "general" },
  address: { type: String, default: "" },
  pdfFile: {
    filename: { type: String },
    originalName: { type: String },
    path: { type: String },
    size: { type: Number },
  },
  submittedAt: { type: Date, default: Date.now },
});

formSubmissionSchema.index({ submittedAt: -1 });
formSubmissionSchema.index({ email: 1 });

const noticeSchema = new mongoose.Schema({
  title: { type: String, required: true },
  content: { type: String, required: true },
  author: { type: String, required: true },
  priority: {
    type: String,
    enum: ["high", "normal", "low"],
    default: "normal",
  },
  pdfFile: {
    filename: { type: String },
    originalName: { type: String },
    mimetype: { type: String },
    size: { type: Number },
  },
  createdAt: { type: Date, default: Date.now },
  isActive: { type: Boolean, default: true },
});

noticeSchema.index({ createdAt: -1 });
noticeSchema.index({ isActive: 1 });

const galleryImageSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  imageUrl: { type: String, required: true },
  altText: { type: String, required: true },
  category: {
    type: String,
    enum: ["meeting", "event", "conference"],
    default: "meeting",
  },
  isActive: { type: Boolean, default: true },
  uploadedBy: { type: String, required: true },
  uploadedAt: { type: Date, default: Date.now },
  order: { type: Number, default: 0 },
});

const newsSchema = new mongoose.Schema({
  title: { type: String, required: true },
  content: { type: String, required: true },
  category: {
    type: String,
    enum: ["business", "policy", "event", "announcement"],
    default: "business",
  },
  author: { type: String, required: true },
  imageUrl: { type: String, default: "" },
  isActive: { type: Boolean, default: true },
  isFeatured: { type: Boolean, default: false },
  publishedAt: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now },
});

newsSchema.index({ publishedAt: -1 });
newsSchema.index({ createdAt: -1 });
newsSchema.index({ isActive: 1 });
newsSchema.index({ isFeatured: 1 });

// Models
const User = mongoose.model("User", userSchema);
const FormSubmission = mongoose.model("FormSubmission", formSubmissionSchema);
const Notice = mongoose.model("Notice", noticeSchema);
const GalleryImage = mongoose.model("GalleryImage", galleryImageSchema);
const News = mongoose.model("News", newsSchema);

// JWT Secret
const JWT_SECRET =
  process.env.JWT_SECRET || "your-secret-key-change-in-production";

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "Access token required" });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: "Invalid or expired token" });
    }
    req.user = user;
    next();
  });
};

// Middleware to check admin role
const requireAdmin = (req, res, next) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Admin access required" });
  }
  next();
};

// API Routes

app.get("/api/health", (req, res) => {
  res.json({
    message: "THE JAMALPUR CHAMBER OF COMMERCE AND INDUSTRY API is running!",
    status: "OK",
    timestamp: new Date().toISOString(),
  });
});

// Test endpoint for frontend-backend connection
app.get("/api/test", (req, res) => {
  res.json({
    status: "success",
    message: "Backend is working!",
    timestamp: new Date().toISOString(),
    frontend_url: req.headers.origin || "No origin header",
    cors_working: true,
    version: "2.0.0",
  });
});

// Test Cloudinary connection
app.get(
  "/api/test/cloudinary",
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    try {
      const result = await cloudinary.api.ping();
      res.json({
        status: "success",
        message: "Cloudinary connection working",
        cloudinary_status: result.status,
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error("❌ Cloudinary test failed:", error);
      res.status(500).json({
        status: "error",
        message: "Cloudinary connection failed",
        error: error.message,
        timestamp: new Date().toISOString(),
      });
    }
  }
);

app.post("/api/auth/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const normalizedEmail = email.trim().toLowerCase();

    const existingUser = await User.findOne({
      email: { $regex: new RegExp(`^${normalizedEmail}$`, "i") },
    });
    if (existingUser) {
      return res
        .status(400)
        .json({ message: "User already exists with this email" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({
      name,
      email: normalizedEmail,
      password: hashedPassword,
    });
    await user.save();

    const token = jwt.sign(
      { userId: user._id, name: user.name, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: "24h" }
    );

    res.status(201).json({
      message: "User registered successfully",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ message: "Server error during registration" });
  }
});

app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const trimmedEmail = email.trim().toLowerCase();

    const user = await User.findOne({
      email: { $regex: new RegExp(`^${trimmedEmail}$`, "i") },
    });
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const token = jwt.sign(
      { userId: user._id, name: user.name, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: "24h" }
    );

    res.json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Server error during login" });
  }
});

app.post("/api/auth/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;
    const trimmedEmail = email.trim().toLowerCase();

    const user = await User.findOne({
      email: { $regex: new RegExp(`^${trimmedEmail}$`, "i") },
    });
    if (!user) {
      return res
        .status(404)
        .json({ message: "No account found with this email address" });
    }

    // Generate secure reset token
    const crypto = require("crypto");
    const resetToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    // Set token and expiration (1 hour)
    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
    await user.save();

    // Create reset URL
    const resetUrl = `${
      process.env.CLIENT_URL || "https://project1-three-dun.vercel.app/"
    }/reset-password/${resetToken}`;

    // Create email template with reset link
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="margin: 0; font-size: 28px;">Password Reset Request</h1>
          <p style="margin: 10px 0 0 0; opacity: 0.9;">Jamalpur Chamber of Commerce & Industry</p>
        </div>
        
        <div style="background: #f8fafc; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e2e8f0;">
          <h2 style="color: #1e40af; margin-top: 0;">Hello ${user.name},</h2>
          
          <p>We received a request to reset your password for your JCCI account. Click the button below to reset your password:</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" style="
              display: inline-block;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              padding: 15px 30px;
              text-decoration: none;
              border-radius: 8px;
              font-weight: bold;
              font-size: 16px;
              box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
            ">Reset My Password</a>
          </div>
          
          <div style="background: #fef3c7; border: 2px solid #f59e0b; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0; color: #92400e; font-weight: 600;">
              ⏰ <strong>Important:</strong> This link will expire in 1 hour for security reasons.
            </p>
          </div>
          
          <div style="background: #fee2e2; border: 1px solid #ef4444; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0; color: #991b1b;">
              🔒 <strong>Security Notice:</strong> If you didn't request this password reset, please ignore this email or contact our support team immediately.
            </p>
          </div>
          
          <p style="color: #64748b; font-size: 14px; margin: 20px 0 0 0;">
            If the button doesn't work, copy and paste this link into your browser:<br>
            <a href="${resetUrl}" style="color: #667eea; word-break: break-all;">${resetUrl}</a>
          </p>
          
          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;">
          
          <p style="color: #64748b; font-size: 14px; margin: 0;">
            This is an automated message from the Jamalpur Chamber of Commerce & Industry system. 
            Please do not reply to this email.
          </p>
        </div>
      </div>
    `;

    // Send email with reset link
    const emailResult = await emailService.sendPasswordResetEmail(
      user.email,
      resetToken
    );

    res.json({
      message: emailResult.success
        ? `Password reset link has been sent to your email address. Please check your inbox.`
        : "Password reset link could not be sent. Please try again later.",
      success: emailResult.success,
      emailSent: emailResult.success,
      resetUrl: emailResult.success ? undefined : resetUrl,
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    res.status(500).json({ message: "Server error during password reset" });
  }
});

// Verify reset token (optional step)
app.get("/api/auth/verify-reset-token/:token", async (req, res) => {
  try {
    const { token } = req.params;
    if (!token) {
      return res.status(400).json({ message: "Reset token is required" });
    }

    const crypto = require("crypto");
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res
        .status(400)
        .json({ message: "Invalid or expired reset token" });
    }

    res.json({
      message: "Reset token is valid",
      success: true,
      email: user.email,
      name: user.name,
    });
  } catch (error) {
    console.error("Verify reset token error:", error);
    res.status(500).json({ message: "Server error during token verification" });
  }
});

app.post("/api/auth/reset-password/:token", async (req, res) => {
  try {
    const { token } = req.params;
    const { newPassword } = req.body;

    if (!token || !newPassword) {
      return res
        .status(400)
        .json({ message: "Reset token and new password are required" });
    }

    if (newPassword.length < 8) {
      return res
        .status(400)
        .json({ message: "Password must be at least 8 characters long" });
    }

    const crypto = require("crypto");
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({
        message:
          "Invalid or expired reset token. Please request a new password reset.",
      });
    }

    // Update password and clear reset token
    user.password = await bcrypt.hash(newPassword, 10);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.json({
      message:
        "Password has been reset successfully. You can now login with your new password.",
      success: true,
    });
  } catch (error) {
    console.error("Reset password error:", error);
    res.status(500).json({ message: "Server error during password reset" });
  }
});

// SMS OTP endpoint (alternative method)
app.post("/api/auth/send-sms-otp", async (req, res) => {
  try {
    const { phoneNumber } = req.body;
    if (!phoneNumber) {
      return res.status(400).json({ message: "Phone number is required" });
    }

    // Find user by phone number (you might need to add phone field to User model)
    const user = await User.findOne({ phoneNumber });
    if (!user) {
      return res
        .status(404)
        .json({ message: "No account found with this phone number" });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const crypto = require("crypto");
    const hashedOTP = crypto.createHash("sha256").update(otp).digest("hex");

    user.resetPasswordToken = hashedOTP;
    user.resetPasswordExpires = Date.now() + 600000; // 10 minutes
    await user.save();

    // Send SMS OTP
    const smsResult = await emailService.sendOTPSMS(phoneNumber, otp);

    res.json({
      message: "OTP has been sent to your phone number via SMS.",
      success: true,
      smsSent: smsResult.success,
      messageId: smsResult.messageId,
    });
  } catch (error) {
    console.error("SMS OTP error:", error);
    res
      .status(500)
      .json({ message: "Failed to send SMS OTP. Please try email method." });
  }
});

// Service status endpoint
app.get("/api/services/status", (req, res) => {
  const status = emailService.getServiceStatus();
  res.json({
    emailServices: status,
    message: "Service status retrieved successfully",
  });
});

// Form Submission
app.post("/api/forms/submit", async (req, res) => {
  try {
    const { name, email, phone, message } = req.body;

    const submission = new FormSubmission({
      name,
      email,
      phone,
      message,
    });

    await submission.save();

    res.status(201).json({
      message: "Form submitted successfully",
      submission: {
        id: submission._id,
        name: submission.name,
        email: submission.email,
        phone: submission.phone,
        message: submission.message,
        submittedAt: submission.submittedAt,
      },
    });
  } catch (error) {
    console.error("Form submission error:", error);
    res.status(500).json({ message: "Server error during form submission" });
  }
});

// Form Submission with File Upload
app.post(
  "/api/forms/submit-with-file",
  upload.single("pdfFile"),
  async (req, res) => {
    try {
      const { name, email, phone, message, category, address } = req.body;

      const submissionData = {
        name,
        email,
        phone,
        message,
        category: category || "general",
        address: address || "",
      };

      // Add PDF file information if uploaded
      if (req.file) {
        submissionData.pdfFile = {
          filename: req.file.filename,
          originalName: req.file.originalname,
          path: req.file.path,
          size: req.file.size,
        };
      }

      const submission = new FormSubmission(submissionData);
      await submission.save();

      res.status(201).json({
        message: "Form submitted successfully",
        submission: {
          id: submission._id,
          name: submission.name,
          email: submission.email,
          phone: submission.phone,
          message: submission.message,
          category: submission.category,
          address: submission.address,
          pdfFile: submission.pdfFile,
          submittedAt: submission.submittedAt,
        },
      });
    } catch (error) {
      console.error("Form submission with file error:", error);

      // Clean up uploaded file if there was an error
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }

      res.status(500).json({ message: "Server error during form submission" });
    }
  }
);

// Get all form submissions (Admin only)
app.get(
  "/api/forms/submissions",
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    try {
      const submissions = await FormSubmission.find().sort({ submittedAt: -1 });
      res.json(submissions);
    } catch (error) {
      console.error("Get submissions error:", error);
      res.status(500).json({ message: "Server error fetching submissions" });
    }
  }
);

// Create Notice (Admin only)
app.post(
  "/api/notices",
  authenticateToken,
  requireAdmin,
  upload.single("pdfFile"),
  async (req, res) => {
    try {
      const { title, content, priority } = req.body;

      const noticeData = {
        title,
        content,
        priority: priority || "normal",
        author: req.user.email,
      };

      // Handle PDF file upload
      if (req.file) {
        noticeData.pdfFile = {
          filename: req.file.filename,
          originalName: req.file.originalname,
          mimetype: req.file.mimetype,
          size: req.file.size,
        };
      }

      const notice = new Notice(noticeData);
      await notice.save();

      // Emit real-time update to all users
      io.to("user").emit("notice-created", {
        id: notice._id,
        title: notice.title,
        content: notice.content,
        priority: notice.priority,
        pdfFile: notice.pdfFile,
        author: notice.author,
        createdAt: notice.createdAt,
      });

      res.status(201).json({
        message: "Notice created successfully",
        notice: {
          id: notice._id,
          title: notice.title,
          content: notice.content,
          priority: notice.priority,
          pdfFile: notice.pdfFile,
          author: notice.author,
          createdAt: notice.createdAt,
        },
      });
    } catch (error) {
      console.error("Create notice error:", error);
      res.status(500).json({ message: "Server error creating notice" });
    }
  }
);

app.get("/api/notices", async (req, res) => {
  try {
    const notices = await Notice.find({ isActive: true })
      .sort({ createdAt: -1 })
      .lean()
      .select("-__v");

    res.set("Cache-Control", "public, max-age=300");
    res.json(notices);
  } catch (error) {
    console.error("Get notices error:", error);
    res.status(500).json({ message: "Server error fetching notices" });
  }
});

// Update Notice (Admin only)
app.put(
  "/api/notices/:id",
  authenticateToken,
  requireAdmin,
  upload.single("pdfFile"),
  async (req, res) => {
    try {
      const { title, content, priority, isActive } = req.body;

      const updateData = { title, content, isActive };
      if (priority) {
        updateData.priority = priority;
      }

      // Handle PDF file upload
      if (req.file) {
        updateData.pdfFile = {
          filename: req.file.filename,
          originalName: req.file.originalname,
          mimetype: req.file.mimetype,
          size: req.file.size,
        };
      }

      const notice = await Notice.findByIdAndUpdate(req.params.id, updateData, {
        new: true,
      });

      if (!notice) {
        return res.status(404).json({ message: "Notice not found" });
      }

      // Emit real-time update to all users
      io.to("user").emit("notice-updated", {
        id: notice._id,
        title: notice.title,
        content: notice.content,
        priority: notice.priority,
        pdfFile: notice.pdfFile,
        author: notice.author,
        isActive: notice.isActive,
        updatedAt: notice.updatedAt,
      });

      res.json({
        message: "Notice updated successfully",
        notice,
      });
    } catch (error) {
      console.error("Update notice error:", error);
      res.status(500).json({ message: "Server error updating notice" });
    }
  }
);

// Delete Notice (Admin only)
app.delete(
  "/api/notices/:id",
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    try {
      const notice = await Notice.findById(req.params.id);
      if (!notice) {
        return res.status(404).json({ message: "Notice not found" });
      }

      // Delete associated PDF file from filesystem if it exists
      if (notice.pdfFile && notice.pdfFile.filename) {
        const filePath = path.join(uploadsDir, notice.pdfFile.filename);
        fs.unlink(filePath, (err) => {
          if (err) {
            console.error("Error deleting PDF file:", err);
          } else {
            console.log("PDF file deleted:", notice.pdfFile.filename);
          }
        });
      }

      // Delete the notice from database
      await Notice.findByIdAndDelete(req.params.id);

      // Emit real-time update to all users
      io.to("user").emit("notice-deleted", {
        id: req.params.id,
      });

      res.json({ message: "Notice deleted successfully" });
    } catch (error) {
      console.error("Delete notice error:", error);
      res.status(500).json({ message: "Server error deleting notice" });
    }
  }
);

// Multer error handling middleware
const handleMulterError = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === "LIMIT_FILE_SIZE") {
      return res
        .status(400)
        .json({ message: "File size too large. Maximum size is 10MB." });
    }
    if (error.code === "LIMIT_UNEXPECTED_FILE") {
      return res
        .status(400)
        .json({ message: "Unexpected field or too many files." });
    }
    return res.status(400).json({ message: `Upload error: ${error.message}` });
  }
  if (error.message === "Only PDF and image files are allowed") {
    return res.status(400).json({ message: error.message });
  }
  next(error);
};

// Gallery Image Upload (Admin only)
app.post(
  "/api/gallery/upload",
  authenticateToken,
  requireAdmin,
  upload.single("image"),
  handleMulterError,
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No image file provided" });
      }

      // Validate file type
      if (!req.file.mimetype.startsWith("image/")) {
        fs.unlink(req.file.path, () => {}); // Clean up
        return res
          .status(400)
          .json({ message: "Only image files are allowed" });
      }

      // Validate file size (additional check)
      if (req.file.size > 10 * 1024 * 1024) {
        fs.unlink(req.file.path, () => {}); // Clean up
        return res
          .status(400)
          .json({ message: "Image file too large. Maximum size is 10MB." });
      }

      console.log("📤 Processing image upload:", {
        filename: req.file.filename,
        mimetype: req.file.mimetype,
        size: req.file.size,
      });

      const { title, description, altText, category, order } = req.body;
      // Upload image to Cloudinary
      let imageUrl = "";
      try {
        console.log("🔧 Uploading to Cloudinary:", req.file.path);
        const cloudinaryResult = await cloudinary.uploader.upload(
          req.file.path,
          {
            folder: "jamalpur-gallery",
            resource_type: "image",
            transformation: [{ quality: "auto" }, { fetch_format: "auto" }],
          }
        );
        imageUrl = cloudinaryResult.secure_url;
        console.log("✅ Cloudinary upload successful:", imageUrl);

        // Delete local file after successful upload
        fs.unlink(req.file.path, (err) => {
          if (err) console.error("❌ Error deleting local file:", err);
        });
      } catch (cloudErr) {
        console.error("❌ Cloudinary upload failed:", cloudErr);
        // Clean up local file on error
        fs.unlink(req.file.path, () => {});
        return res.status(500).json({
          message: "Failed to upload image to cloud storage",
          error:
            process.env.NODE_ENV === "development"
              ? cloudErr.message
              : "Upload failed",
        });
      }

      // Log optimization results if available
      if (req.file.optimized) {
        console.log(
          `📊 Image optimized: ${req.file.originalDimensions.width}x${req.file.originalDimensions.height}`
        );
      }

      // Validate required fields
      if (!title || title.trim() === "") {
        return res.status(400).json({ message: "Title is required" });
      }
      if (!description || description.trim() === "") {
        return res.status(400).json({ message: "Description is required" });
      }
      if (!altText || altText.trim() === "") {
        return res.status(400).json({ message: "Alt text is required" });
      }
      if (!req.user) {
        return res
          .status(400)
          .json({ message: "User authentication is missing" });
      }

      // Get user name from token or fetch from database as fallback
      let userName = req.user.name;
      if (!userName) {
        try {
          const user = await User.findById(req.user.userId);
          if (user) {
            userName = user.name;
          } else {
            return res.status(400).json({ message: "User not found" });
          }
        } catch (error) {
          console.error("Error fetching user:", error);
          return res
            .status(400)
            .json({ message: "Unable to verify user information" });
        }
      }

      // Validate category
      const validCategories = ["meeting", "event", "conference"];
      const selectedCategory = category || "meeting";
      if (!validCategories.includes(selectedCategory)) {
        return res.status(400).json({
          message:
            "Invalid category. Must be one of: meeting, event, conference",
        });
      }

      const galleryImage = new GalleryImage({
        title: title.trim(),
        description: description.trim(),
        imageUrl,
        altText: altText.trim(),
        category: selectedCategory,
        uploadedBy: userName,
        order: parseInt(order) || 0,
      });

      console.log("💾 Saving image to database:", {
        title: galleryImage.title,
        imageUrl: galleryImage.imageUrl,
        uploadedBy: galleryImage.uploadedBy,
      });

      await galleryImage.save();
      console.log("✅ Image saved to database with ID:", galleryImage._id);

      // Emit real-time update to all clients (users and admins)
      io.emit("gallery-image-created", {
        id: galleryImage._id,
        title: galleryImage.title,
        description: galleryImage.description,
        imageUrl: galleryImage.imageUrl,
        altText: galleryImage.altText,
        category: galleryImage.category,
        uploadedBy: galleryImage.uploadedBy,
        order: galleryImage.order,
        uploadedAt: galleryImage.uploadedAt,
      });

      res.json({ message: "Image uploaded successfully", image: galleryImage });
    } catch (error) {
      console.error("❌ Gallery Upload Error:", error);

      // Clean up uploaded file on any error
      if (req.file && req.file.path) {
        fs.unlink(req.file.path, (err) => {
          if (err) console.error("❌ Error cleaning up file:", err);
        });
      }

      // Handle Mongoose validation errors
      if (error.name === "ValidationError") {
        const validationErrors = Object.values(error.errors).map(
          (err) => err.message
        );
        return res.status(400).json({
          message: "Validation failed",
          errors: validationErrors,
        });
      }

      // Handle MongoDB duplicate key error
      if (error.code === 11000) {
        return res.status(400).json({
          message: "Duplicate entry detected",
          error: "An image with similar data already exists",
        });
      }

      res.status(500).json({
        message: "Internal server error during image upload",
        error:
          process.env.NODE_ENV === "development"
            ? error.message
            : "Upload failed",
      });
    }
  }
);

app.get("/api/gallery", async (req, res) => {
  try {
    const images = await GalleryImage.find({ isActive: true })
      .sort({ order: 1, uploadedAt: -1 })
      .lean()
      .select("-__v");

    // Disable caching so new uploads appear immediately across clients
    res.set(
      "Cache-Control",
      "no-store, no-cache, must-revalidate, proxy-revalidate"
    );
    res.set("Pragma", "no-cache");
    res.set("Expires", "0");
    res.json(images);
  } catch (error) {
    console.error("Get Gallery Error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Get all gallery images (Admin only)
app.get(
  "/api/gallery/admin",
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    try {
      const images = await GalleryImage.find().sort({
        order: 1,
        uploadedAt: -1,
      });
      res.json(images);
    } catch (error) {
      console.error("Get Gallery Admin Error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }
);

// Update gallery image (Admin only)
app.put(
  "/api/gallery/:id",
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    try {
      // Validate id format early
      const { id } = req.params;
      if (!id || !mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: "Invalid image id" });
      }
      const { title, description, altText, category, isActive, order } =
        req.body;

      // Validate required fields if provided
      if (title !== undefined && (!title || title.trim() === "")) {
        return res.status(400).json({ message: "Title cannot be empty" });
      }
      if (
        description !== undefined &&
        (!description || description.trim() === "")
      ) {
        return res.status(400).json({ message: "Description cannot be empty" });
      }
      if (altText !== undefined && (!altText || altText.trim() === "")) {
        return res.status(400).json({ message: "Alt text cannot be empty" });
      }

      // Validate category if provided
      if (category !== undefined) {
        const validCategories = ["meeting", "event", "conference"];
        if (!validCategories.includes(category)) {
          return res.status(400).json({
            message:
              "Invalid category. Must be one of: meeting, event, conference",
          });
        }
      }

      // Prepare update object
      const updateData = {};
      if (title !== undefined) updateData.title = title.trim();
      if (description !== undefined)
        updateData.description = description.trim();
      if (altText !== undefined) updateData.altText = altText.trim();
      if (category !== undefined) updateData.category = category;
      if (isActive !== undefined) updateData.isActive = isActive;
      if (order !== undefined) updateData.order = parseInt(order) || 0;

      const galleryImage = await GalleryImage.findByIdAndUpdate(
        id,
        updateData,
        { new: true, runValidators: true }
      );

      if (!galleryImage) {
        return res.status(404).json({ message: "Image not found" });
      }

      // Emit real-time update to all clients (users and admins)
      io.emit("gallery-image-updated", {
        id: galleryImage._id,
        title: galleryImage.title,
        description: galleryImage.description,
        imageUrl: galleryImage.imageUrl,
        altText: galleryImage.altText,
        category: galleryImage.category,
        uploadedBy: galleryImage.uploadedBy,
        order: galleryImage.order,
        isActive: galleryImage.isActive,
        uploadedAt: galleryImage.uploadedAt,
      });

      res.json({ message: "Image updated successfully", image: galleryImage });
    } catch (error) {
      console.error("Update Gallery Error:", error);

      // Handle Mongoose validation errors
      if (error.name === "ValidationError") {
        const validationErrors = Object.values(error.errors).map(
          (err) => err.message
        );
        return res.status(400).json({
          message: "Validation failed",
          errors: validationErrors,
        });
      }

      res.status(500).json({ message: "Internal server error" });
    }
  }
);

// Delete gallery image (Admin only)
app.delete(
  "/api/gallery/:id",
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    try {
      const { id } = req.params;
      if (!id || !mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: "Invalid image id" });
      }

      const galleryImage = await GalleryImage.findById(id);
      if (!galleryImage) {
        return res.status(404).json({ message: "Image not found" });
      }

      // Delete the file from filesystem
      const filePath = path.join(
        uploadsDir,
        galleryImage.imageUrl.split("/").pop()
      );
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }

      await GalleryImage.findByIdAndDelete(id);
      console.log("✅ Gallery image deleted from database:", id);

      // Emit real-time update to all clients (users and admins)
      io.emit("gallery-image-deleted", { id });
      console.log("📡 Broadcasted gallery-image-deleted event to all clients");

      res.json({ message: "Image deleted successfully" });
    } catch (error) {
      console.error("Delete Gallery Error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }
);

// News API

app.get("/api/news", async (req, res) => {
  try {
    const news = await News.find({ isActive: true })
      .sort({ publishedAt: -1, createdAt: -1 })
      .limit(10)
      .lean()
      .select("-__v");

    res.set("Cache-Control", "public, max-age=300");
    res.json(news);
  } catch (error) {
    console.error("Get news error:", error);
    res.status(500).json({ message: "Server error fetching news" });
  }
});

// Get all news for admin (with inactive)
app.get(
  "/api/news/admin",
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    try {
      const news = await News.find().sort({ publishedAt: -1, createdAt: -1 });
      res.json(news);
    } catch (error) {
      console.error("Get admin news error:", error);
      res.status(500).json({ message: "Server error fetching news" });
    }
  }
);

// Create news article (Admin only)
app.post("/api/news", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { title, content, category, imageUrl, isFeatured } = req.body;

    // Validation
    if (!title || !content) {
      return res
        .status(400)
        .json({ message: "Title and content are required" });
    }

    if (title.trim().length < 3) {
      return res
        .status(400)
        .json({ message: "Title must be at least 3 characters long" });
    }

    if (content.trim().length < 10) {
      return res
        .status(400)
        .json({ message: "Content must be at least 10 characters long" });
    }

    const news = new News({
      title: title.trim(),
      content: content.trim(),
      category: category || "business",
      author: req.user.name || "Admin",
      imageUrl: imageUrl || "",
      isFeatured: isFeatured || false,
    });

    await news.save();

    // Emit real-time update to all users
    console.log("📡 Backend: Emitting news-created event to user room");
    const userRoom = io.sockets.adapter.rooms.get("user");
    console.log(
      "📡 Backend: Users in user room:",
      userRoom ? userRoom.size : 0
    );
    io.to("user").emit("news-created", {
      id: news._id,
      title: news.title,
      content: news.content,
      category: news.category,
      author: news.author,
      imageUrl: news.imageUrl,
      isFeatured: news.isFeatured,
      publishedAt: news.publishedAt,
    });
    console.log("📡 Backend: News-created event emitted successfully");

    res.status(201).json(news);
  } catch (error) {
    console.error("Create news error:", error);
    res.status(500).json({ message: "Server error creating news" });
  }
});

// Update news article (Admin only)
app.put("/api/news/:id", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { title, content, category, imageUrl, isActive, isFeatured } =
      req.body;

    const updateData = {};
    if (title !== undefined) {
      if (!title.trim()) {
        return res.status(400).json({ message: "Title cannot be empty" });
      }
      updateData.title = title.trim();
    }

    if (content !== undefined) {
      if (!content.trim()) {
        return res.status(400).json({ message: "Content cannot be empty" });
      }
      updateData.content = content.trim();
    }

    if (category !== undefined) updateData.category = category;
    if (imageUrl !== undefined) updateData.imageUrl = imageUrl;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (isFeatured !== undefined) updateData.isFeatured = isFeatured;

    const news = await News.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
    });

    if (!news) {
      return res.status(404).json({ message: "News article not found" });
    }

    // Emit real-time update to all users
    io.to("user").emit("news-updated", {
      id: news._id,
      title: news.title,
      content: news.content,
      category: news.category,
      author: news.author,
      imageUrl: news.imageUrl,
      isActive: news.isActive,
      isFeatured: news.isFeatured,
      publishedAt: news.publishedAt,
    });

    res.json(news);
  } catch (error) {
    console.error("Update news error:", error);
    res.status(500).json({ message: "Server error updating news" });
  }
});

// Delete news article (Admin only)
app.delete(
  "/api/news/:id",
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    try {
      const news = await News.findByIdAndDelete(req.params.id);
      if (!news) {
        return res.status(404).json({ message: "News article not found" });
      }

      // Emit real-time update to all users
      io.to("user").emit("news-deleted", {
        id: req.params.id,
      });

      res.json({ message: "News article deleted successfully" });
    } catch (error) {
      console.error("Delete news error:", error);
      res.status(500).json({ message: "Server error deleting news" });
    }
  }
);

// Get user profile
app.get("/api/auth/profile", authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json(user);
  } catch (error) {
    console.error("Get profile error:", error);
    res.status(500).json({ message: "Server error fetching profile" });
  }
});

// Change password (for logged-in users)
app.post("/api/auth/change-password", authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    // Validation
    if (!currentPassword || !newPassword) {
      return res
        .status(400)
        .json({ message: "Current password and new password are required" });
    }

    if (newPassword.length < 8) {
      return res
        .status(400)
        .json({ message: "New password must be at least 8 characters long" });
    }

    // Find user
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Verify current password
    const isValidPassword = await bcrypt.compare(
      currentPassword,
      user.password
    );
    if (!isValidPassword) {
      return res.status(401).json({ message: "Current password is incorrect" });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    user.password = hashedPassword;
    await user.save();

    // Emit real-time update to admin users
    io.to("admin").emit("admin-password-changed", {
      id: user._id,
      updatedAt: new Date(),
    });

    res.json({
      message: "Password changed successfully",
      success: true,
    });
  } catch (error) {
    console.error("Change password error:", error);
    res.status(500).json({ message: "Server error during password change" });
  }
});

// Get all admins (Admin only)
app.get(
  "/api/admin/users",
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    try {
      const users = await User.find({ role: "admin" }).select(
        "-password -resetPasswordToken -resetPasswordExpires"
      );
      res.json(users);
    } catch (error) {
      console.error("Get admins error:", error);
      res.status(500).json({ message: "Server error fetching admins" });
    }
  }
);

// Create new admin (Admin only)
app.post(
  "/api/admin/users",
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    try {
      const { name, email, password } = req.body;

      // Validation
      if (!name || !email || !password) {
        return res
          .status(400)
          .json({ message: "Name, email, and password are required" });
      }

      if (password.length < 8) {
        return res
          .status(400)
          .json({ message: "Password must be at least 8 characters long" });
      }

      // Check if email already exists
      const existingUser = await User.findOne({ email: email.toLowerCase() });
      if (existingUser) {
        return res
          .status(400)
          .json({ message: "An account with this email already exists" });
      }

      // Create new admin
      const hashedPassword = await bcrypt.hash(password, 10);
      const newAdmin = new User({
        name: name.trim(),
        email: email.toLowerCase().trim(),
        password: hashedPassword,
        role: "admin",
      });

      await newAdmin.save();

      res.status(201).json({
        message: "Admin created successfully",
        user: {
          id: newAdmin._id,
          name: newAdmin.name,
          email: newAdmin.email,
          role: newAdmin.role,
          createdAt: newAdmin.createdAt,
        },
      });
    } catch (error) {
      console.error("Create admin error:", error);
      res.status(500).json({ message: "Server error creating admin" });
    }
  }
);

// Update user profile (Admin only)
app.put(
  "/api/admin/profile",
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    try {
      const { name, email } = req.body;

      // Validation
      if (!name || !email) {
        return res.status(400).json({ message: "Name and email are required" });
      }

      // Check if email is taken by another user
      const existingUser = await User.findOne({
        email: email.toLowerCase(),
        _id: { $ne: req.user.userId },
      });
      if (existingUser) {
        return res
          .status(400)
          .json({ message: "This email is already taken by another user" });
      }

      // Update user
      const updatedUser = await User.findByIdAndUpdate(
        req.user.userId,
        {
          name: name.trim(),
          email: email.toLowerCase().trim(),
        },
        { new: true }
      ).select("-password -resetPasswordToken -resetPasswordExpires");

      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }

      // Emit real-time update to admin users
      io.to("admin").emit("admin-profile-updated", {
        id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        updatedAt: updatedUser.updatedAt,
      });

      res.json({
        message: "Profile updated successfully",
        user: updatedUser,
      });
    } catch (error) {
      console.error("Update profile error:", error);
      res.status(500).json({ message: "Server error updating profile" });
    }
  }
);

// Delete admin (Admin only)
app.delete(
  "/api/admin/users/:id",
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    try {
      const adminId = req.params.id;

      // Prevent deleting self
      if (adminId === req.user.userId) {
        return res
          .status(400)
          .json({ message: "You cannot delete your own account" });
      }

      const deletedAdmin = await User.findByIdAndDelete(adminId);
      if (!deletedAdmin) {
        return res.status(404).json({ message: "Admin not found" });
      }

      res.json({ message: "Admin deleted successfully" });
    } catch (error) {
      console.error("Delete admin error:", error);
      res.status(500).json({ message: "Server error deleting admin" });
    }
  }
);

// Initialize default admin user
const initializeDefaultAdmin = async () => {
  try {
    const adminExists = await User.findOne({ email: "admin@admin.com" });

    if (!adminExists) {
      // Only create admin if it doesn't exist
      const hashedPassword = await bcrypt.hash("admin123", 10);
      const adminUser = new User({
        name: "Admin",
        email: "admin@admin.com",
        password: hashedPassword,
        role: "admin",
      });
      await adminUser.save();
      console.log("✅ Default admin user created: admin@admin.com / admin123");
    } else {
      // Admin exists - don't reset password
      console.log("✅ Admin user already exists: admin@admin.com");
    }
  } catch (error) {
    console.error("❌ Error creating/resetting admin:", error);
  }
};

// Socket.IO connection handling
io.on("connection", (socket) => {
  console.log(`🔌 Client connected: ${socket.id}`);

  // Join admin room for real-time updates
  socket.on("join-admin", () => {
    socket.join("admin");
    console.log(`👑 Admin joined: ${socket.id}`);
  });

  // Join user room for general updates
  socket.on("join-user", () => {
    socket.join("user");
    console.log(`👤 User joined: ${socket.id}`);
  });

  socket.on("disconnect", () => {
    console.log(`🔌 Client disconnected: ${socket.id}`);
  });
});

// Start server
server.listen(PORT, async () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌐 API Base URL: http://localhost:${PORT}/api`);
  console.log(`🔌 WebSocket server ready for real-time updates`);

  // Initialize default admin after server starts
  await initializeDefaultAdmin();

  // Start keepalive service to prevent Render from sleeping
  keepAliveService.start();
});
