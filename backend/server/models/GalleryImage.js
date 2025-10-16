const mongoose = require('mongoose');

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
  tags: [{ type: String }],
  viewCount: { type: Number, default: 0 }
});

// Indexes for better performance
galleryImageSchema.index({ uploadedAt: -1 });
galleryImageSchema.index({ category: 1 });
galleryImageSchema.index({ isActive: 1 });
galleryImageSchema.index({ order: 1 });
galleryImageSchema.index({ tags: 1 });

// Virtual for image summary
galleryImageSchema.virtual('summary').get(function() {
  return {
    id: this._id,
    title: this.title,
    category: this.category,
    imageUrl: this.imageUrl,
    uploadedAt: this.uploadedAt,
    isActive: this.isActive,
    order: this.order
  };
});

// Method to increment view count
galleryImageSchema.methods.incrementViewCount = function() {
  this.viewCount += 1;
  return this.save();
};

// Static method to get active images
galleryImageSchema.statics.getActiveImages = function() {
  return this.find({ isActive: true }).sort({ order: 1, uploadedAt: -1 });
};

// Static method to get images by category
galleryImageSchema.statics.getByCategory = function(category) {
  return this.find({ isActive: true, category }).sort({ order: 1, uploadedAt: -1 });
};

module.exports = mongoose.model('GalleryImage', galleryImageSchema);
