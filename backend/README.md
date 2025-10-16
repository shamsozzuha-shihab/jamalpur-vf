# Jamalpur Chamber of Commerce & Industry - Backend API

A modern, scalable backend API built with Node.js, Express, and MongoDB following the MVC (Model-View-Controller) architectural pattern.

## 🏗️ Project Structure

```
backend/
├── server/
│   ├── app.js                 # Express app configuration
│   ├── server.js              # Server entry point
│   ├── models/                # Database models (MongoDB/Mongoose)
│   │   ├── User.js
│   │   ├── Notice.js
│   │   ├── FormSubmission.js
│   │   ├── GalleryImage.js
│   │   └── News.js
│   ├── controllers/           # Business logic controllers
│   │   ├── authController.js
│   │   ├── noticeController.js
│   │   ├── formController.js
│   │   ├── userController.js
│   │   └── galleryController.js
│   ├── routes/                # API route definitions
│   │   ├── index.js
│   │   ├── authRoutes.js
│   │   ├── noticeRoutes.js
│   │   ├── formRoutes.js
│   │   ├── userRoutes.js
│   │   └── galleryRoutes.js
│   ├── middleware/            # Custom middleware
│   │   ├── auth.js
│   │   ├── errorHandler.js
│   │   ├── cloudinaryUpload.js
│   │   ├── rateLimiter.js
│   │   └── pagination.js
│   ├── config/                # Configuration files
│   │   ├── database.js
│   │   ├── cloudinary.js
│   │   └── production.js
│   ├── uploads/               # Legacy file storage
│   └── temp/                  # Temporary file storage
├── package.json
└── README.md
```

## 🚀 Features

### Core Features
- **Authentication & Authorization**: JWT-based auth with role-based access control
- **File Upload**: Cloudinary integration for PDF and image storage
- **Real-time Updates**: Socket.io for live notifications
- **Email Service**: Brevo integration for notifications
- **Rate Limiting**: Protection against abuse
- **Security**: Helmet, CORS, input validation

### API Endpoints

#### Authentication (`/api/auth`)
- `POST /register` - User registration
- `POST /login` - User login
- `GET /profile` - Get user profile
- `PUT /profile` - Update user profile
- `PUT /change-password` - Change password
- `POST /request-password-reset` - Request password reset
- `POST /reset-password` - Reset password
- `POST /logout` - Logout

#### Notices (`/api/notices`)
- `GET /` - Get all notices (public)
- `GET /:id` - Get notice by ID
- `GET /search` - Search notices
- `GET /priority/:priority` - Get notices by priority
- `GET /high-priority` - Get high priority notices
- `POST /` - Create notice (admin)
- `PUT /:id` - Update notice (admin)
- `DELETE /:id` - Delete notice (admin)

#### Forms (`/api/forms`)
- `POST /submit` - Submit form without file
- `POST /submit-with-file` - Submit form with PDF file
- `GET /submissions` - Get all submissions (admin)
- `GET /submissions/:id` - Get submission by ID (admin)
- `PUT /submissions/:id/status` - Update submission status (admin)
- `DELETE /submissions/:id` - Delete submission (admin)

#### Users (`/api/admin/users`)
- `GET /` - Get all users (admin)
- `GET /:id` - Get user by ID (admin)
- `POST /` - Create user (admin)
- `PUT /:id` - Update user (admin)
- `DELETE /:id` - Delete user (admin)
- `GET /stats` - Get user statistics (admin)

#### Gallery (`/api/gallery`)
- `GET /` - Get all gallery images (public)
- `GET /:id` - Get image by ID
- `GET /category/:category` - Get images by category
- `POST /upload` - Upload image (admin)
- `PUT /:id` - Update image (admin)
- `DELETE /:id` - Delete image (admin)

## 🛠️ Installation & Setup

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (local or cloud)
- Cloudinary account
- Brevo account (for email service)

### Environment Variables
Create a `.env` file in the backend directory:

```env
# Server Configuration
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000

# Database
MONGODB_URI=mongodb://localhost:27017/jamalpur-chamber

# JWT
JWT_SECRET=your-super-secure-jwt-secret
JWT_EXPIRES_IN=24h

# Cloudinary
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Email Service (Brevo)
BREVO_API_KEY=your-brevo-api-key

# Security
BCRYPT_ROUNDS=10
MAX_FILE_SIZE=10485760
ALLOWED_FILE_TYPES=image/jpeg,image/png,image/gif,application/pdf
```

### Installation
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Start production server
npm start
```

## 📊 Database Models

### User Model
- Authentication and authorization
- Role-based access (user/admin)
- Password reset functionality

### Notice Model
- Public announcements
- Priority levels (high/normal/low)
- PDF file attachments
- View tracking

### FormSubmission Model
- Contact form submissions
- PDF file attachments
- Status tracking (pending/reviewed/approved/rejected)
- Admin review system

### GalleryImage Model
- Image gallery management
- Category organization
- Order management
- View tracking

### News Model
- News articles
- Category organization
- Featured articles
- View tracking

## 🔒 Security Features

- **JWT Authentication**: Secure token-based authentication
- **Role-based Access Control**: Admin and user roles
- **Rate Limiting**: Protection against abuse
- **Input Validation**: Comprehensive request validation
- **File Upload Security**: Type and size restrictions
- **CORS Configuration**: Cross-origin request handling
- **Helmet**: Security headers

## 🚀 Deployment

### Production Environment
1. Set `NODE_ENV=production`
2. Configure production MongoDB URI
3. Set secure JWT secret
4. Configure Cloudinary credentials
5. Set up email service

### Render Deployment
The application is configured for Render deployment with:
- Automatic builds from GitHub
- Environment variable configuration
- Health check endpoints

## 📝 API Documentation

### Response Format
All API responses follow a consistent format:

```json
{
  "success": true|false,
  "message": "Response message",
  "data": {
    // Response data
  },
  "pagination": {
    // Pagination info (when applicable)
  }
}
```

### Error Handling
- Consistent error response format
- HTTP status codes
- Detailed error messages in development
- Sanitized error messages in production

## 🔧 Development

### Adding New Features
1. Create model in `models/` directory
2. Create controller in `controllers/` directory
3. Create routes in `routes/` directory
4. Add routes to `routes/index.js`
5. Update documentation

### Code Style
- ES6+ JavaScript
- Async/await pattern
- Consistent error handling
- Comprehensive logging
- Input validation

## 📞 Support

For support and questions:
- GitHub Issues: [Repository Issues](https://github.com/shamsozzuha-shihab/jamapur_backend_2/issues)
- Email: [Contact Information]

## 📄 License

This project is licensed under the MIT License.
