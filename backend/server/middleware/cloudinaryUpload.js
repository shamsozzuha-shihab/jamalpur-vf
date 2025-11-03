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
    // Build base configuration
    const baseConfig = {
      folder: "jamalpur-chamber",
      resource_type: "auto",
      type: "upload", // Ensure it's a standard upload
      access_mode: "public", // CRITICAL: Make files publicly accessible
      ...options
    };
    
    // Only add image-specific options if resource_type is NOT 'raw' (for PDFs)
    if (baseConfig.resource_type !== 'raw') {
      baseConfig.quality = "auto";
      baseConfig.fetch_format = "auto";
    }
    
    // Log upload configuration for debugging
    console.log('📤 Uploading to Cloudinary:', {
      resource_type: baseConfig.resource_type,
      folder: baseConfig.folder,
      hasQuality: !!baseConfig.quality,
      hasFetchFormat: !!baseConfig.fetch_format,
      filePath: filePath
    });
    
    const result = await cloudinary.uploader.upload(filePath, baseConfig);
    
    // Log upload result
    console.log('✅ Cloudinary upload result:', {
      resource_type: result.resource_type,
      format: result.format,
      secure_url: result.secure_url,
      public_id: result.public_id,
      bytes: result.bytes
    });
    
    // Verify PDFs are uploaded as raw
    if (options.resource_type === 'raw' && result.resource_type !== 'raw') {
      console.error('⚠️ WARNING: PDF uploaded but resource_type is not raw!', {
        expected: 'raw',
        actual: result.resource_type,
        url: result.secure_url
      });
    }
    
    // CRITICAL FIX: Ensure PDFs use raw URL format
    // Cloudinary sometimes returns image URLs even for raw uploads
    if (options.resource_type === 'raw' || result.resource_type === 'raw') {
      // Ensure the URL uses /raw/upload/ path instead of /image/upload/
      if (result.secure_url && result.secure_url.includes('/image/upload/')) {
        result.secure_url = result.secure_url.replace('/image/upload/', '/raw/upload/');
        console.log('🔧 Fixed URL to use raw format:', result.secure_url);
      }
    }
    
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
const deleteFromCloudinary = async (publicId, resourceType = 'image') => {
  try {
    if (publicId) {
      await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
      console.log(`✅ Deleted file from Cloudinary: ${publicId} (resource_type: ${resourceType})`);
    }
  } catch (error) {
    console.error(`❌ Error deleting file from Cloudinary: ${error.message}`);
  }
};

// Helper function to get file URL from Cloudinary
const getFileUrl = (publicId, resourceType = "auto") => {
  if (!publicId) return null;
  
  const config = {
    resource_type: resourceType,
    secure: true
  };
  
  // Only add image-specific options if resource_type is NOT 'raw'
  if (resourceType !== 'raw') {
    config.quality = "auto";
    config.fetch_format = "auto";
  }
  
  return cloudinary.url(publicId, config);
};

module.exports = {
  upload,
  uploadToCloudinary,
  deleteFromCloudinary,
  getFileUrl,
  cloudinary
};
