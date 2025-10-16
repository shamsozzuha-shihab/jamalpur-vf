const mongoose = require('mongoose');

const formSubmissionSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  message: { type: String, required: true },
  category: { type: String, default: "general" },
  address: { type: String, default: "" },
  pdfFile: {
    publicId: { type: String }, // Cloudinary public ID
    originalName: { type: String },
    url: { type: String }, // Cloudinary URL
    size: { type: Number },
    mimetype: { type: String },
  },
  submittedAt: { type: Date, default: Date.now },
  status: { 
    type: String, 
    enum: ["pending", "reviewed", "approved", "rejected"], 
    default: "pending" 
  },
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  reviewedAt: { type: Date },
  adminNotes: { type: String, default: "" }
});

// Indexes for better performance
formSubmissionSchema.index({ submittedAt: -1 });
formSubmissionSchema.index({ email: 1 });
formSubmissionSchema.index({ status: 1 });
formSubmissionSchema.index({ category: 1 });

// Virtual for submission summary
formSubmissionSchema.virtual('summary').get(function() {
  return {
    id: this._id,
    name: this.name,
    email: this.email,
    category: this.category,
    status: this.status,
    submittedAt: this.submittedAt,
    hasFile: !!this.pdfFile?.url
  };
});

// Method to check if submission has PDF file
formSubmissionSchema.methods.hasFile = function() {
  return !!(this.pdfFile && this.pdfFile.url);
};

// Method to get file info
formSubmissionSchema.methods.getFileInfo = function() {
  if (!this.pdfFile) return null;
  return {
    originalName: this.pdfFile.originalName,
    url: this.pdfFile.url,
    size: this.pdfFile.size,
    mimetype: this.pdfFile.mimetype
  };
};

module.exports = mongoose.model('FormSubmission', formSubmissionSchema);
