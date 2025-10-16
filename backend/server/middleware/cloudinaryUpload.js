const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const path = require("path");
const fs = require("fs");

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Create temporary storage for files before uploading to Cloudinary
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const tempDir = path.join(__dirname, "../temp");
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    cb(null, tempDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${file.fieldname}-${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

// Create multer upload middleware
const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    // Allow PDF files and images
    const allowedMimes = [
      "application/pdf",
      "image/jpeg",
      "image/jpg", 
      "image/png",
      "image/gif"
    ];
    
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only PDF and image files are allowed"), false);
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
});

// Helper function to upload file to Cloudinary
const uploadToCloudinary = async (filePath, options = {}) => {
  try {
    const result = await cloudinary.uploader.upload(filePath, {
      folder: "jamalpur-chamber",
      resource_type: "auto",
      quality: "auto",
      fetch_format: "auto",
      ...options
    });
    
    // Clean up temporary file
    fs.unlinkSync(filePath);
    
    return result;
  } catch (error) {
    // Clean up temporary file on error
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    throw error;
  }
};

// Helper function to delete file from Cloudinary
const deleteFromCloudinary = async (publicId) => {
  try {
    if (publicId) {
      await cloudinary.uploader.destroy(publicId);
      console.log(`✅ Deleted file from Cloudinary: ${publicId}`);
    }
  } catch (error) {
    console.error(`❌ Error deleting file from Cloudinary: ${error.message}`);
  }
};

// Helper function to get file URL from Cloudinary
const getFileUrl = (publicId, resourceType = "auto") => {
  if (!publicId) return null;
  
  return cloudinary.url(publicId, {
    resource_type: resourceType,
    secure: true,
    quality: "auto",
    fetch_format: "auto"
  });
};

module.exports = {
  upload,
  uploadToCloudinary,
  deleteFromCloudinary,
  getFileUrl,
  cloudinary
};
