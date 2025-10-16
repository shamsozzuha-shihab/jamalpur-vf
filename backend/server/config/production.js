// Production Configuration for Jamalpur Chamber Backend
module.exports = {
  // Server Configuration
  port: process.env.PORT || 10000,
  nodeEnv: process.env.NODE_ENV || 'production',
  
  // Database Configuration
  mongodb: {
    uri: process.env.MONGODB_URI,
    options: {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      bufferMaxEntries: 0,
      bufferCommands: false
    }
  },
  
  // JWT Configuration
  jwt: {
    secret: process.env.JWT_SECRET || 'your-super-secure-jwt-secret-key-here',
    expiresIn: '24h'
  },
  
  // CORS Configuration
  cors: {
    origin: process.env.FRONTEND_URL || 'https://your-frontend-url.vercel.app',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  },
  
  // File Upload Configuration
  upload: {
    limits: {
      fileSize: 10 * 1024 * 1024, // 10MB
      files: 1
    },
    fileFilter: (req, file, cb) => {
      // Allow images and PDFs
      if (file.mimetype.startsWith('image/') || file.mimetype === 'application/pdf') {
        cb(null, true);
      } else {
        cb(new Error('Only images and PDF files are allowed'), false);
      }
    }
  },
  
  // Email Configuration
  email: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
    service: 'gmail'
  },
  
  // Security Configuration
  security: {
    rateLimit: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100 // limit each IP to 100 requests per windowMs
    },
    helmet: {
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", "data:", "https:"],
          connectSrc: ["'self'", "wss:", "https:"]
        }
      }
    }
  },
  
  // Logging Configuration
  logging: {
    level: 'info',
    format: 'combined'
  },
  
  // Performance Configuration
  performance: {
    compression: {
      level: 6,
      threshold: 1024
    },
    cache: {
      maxAge: '1d'
    }
  }
};
