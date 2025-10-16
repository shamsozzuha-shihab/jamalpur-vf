const mongoose = require('mongoose');

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
    publicId: { type: String }, // Cloudinary public ID
    originalName: { type: String },
    url: { type: String }, // Cloudinary URL
    mimetype: { type: String },
    size: { type: Number },
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  isActive: { type: Boolean, default: true },
  tags: [{ type: String }],
  viewCount: { type: Number, default: 0 }
});

// Indexes for better performance
noticeSchema.index({ createdAt: -1 });
noticeSchema.index({ isActive: 1 });
noticeSchema.index({ priority: 1 });
noticeSchema.index({ author: 1 });
noticeSchema.index({ tags: 1 });

// Update the updatedAt field before saving
noticeSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Virtual for notice summary
noticeSchema.virtual('summary').get(function() {
  return {
    id: this._id,
    title: this.title,
    author: this.author,
    priority: this.priority,
    createdAt: this.createdAt,
    isActive: this.isActive,
    hasFile: !!this.pdfFile?.url,
    viewCount: this.viewCount
  };
});

// Method to check if notice has PDF file
noticeSchema.methods.hasFile = function() {
  return !!(this.pdfFile && this.pdfFile.url);
};

// Method to get file info
noticeSchema.methods.getFileInfo = function() {
  if (!this.pdfFile) return null;
  return {
    originalName: this.pdfFile.originalName,
    url: this.pdfFile.url,
    size: this.pdfFile.size,
    mimetype: this.pdfFile.mimetype
  };
};

// Method to increment view count
noticeSchema.methods.incrementViewCount = function() {
  this.viewCount += 1;
  return this.save();
};

// Static method to get active notices
noticeSchema.statics.getActiveNotices = function() {
  return this.find({ isActive: true }).sort({ createdAt: -1 });
};

// Static method to get notices by priority
noticeSchema.statics.getByPriority = function(priority) {
  return this.find({ isActive: true, priority }).sort({ createdAt: -1 });
};

module.exports = mongoose.model('Notice', noticeSchema);
