const mongoose = require('mongoose');

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
  updatedAt: { type: Date, default: Date.now },
  tags: [{ type: String }],
  viewCount: { type: Number, default: 0 },
  excerpt: { type: String, maxlength: 200 }
});

// Indexes for better performance
newsSchema.index({ publishedAt: -1 });
newsSchema.index({ createdAt: -1 });
newsSchema.index({ isActive: 1 });
newsSchema.index({ isFeatured: 1 });
newsSchema.index({ category: 1 });
newsSchema.index({ author: 1 });
newsSchema.index({ tags: 1 });

// Update the updatedAt field before saving
newsSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  
  // Auto-generate excerpt if not provided
  if (!this.excerpt && this.content) {
    this.excerpt = this.content.substring(0, 200).trim() + '...';
  }
  
  next();
});

// Virtual for news summary
newsSchema.virtual('summary').get(function() {
  return {
    id: this._id,
    title: this.title,
    category: this.category,
    author: this.author,
    publishedAt: this.publishedAt,
    isActive: this.isActive,
    isFeatured: this.isFeatured,
    hasImage: !!this.imageUrl,
    viewCount: this.viewCount
  };
});

// Method to increment view count
newsSchema.methods.incrementViewCount = function() {
  this.viewCount += 1;
  return this.save();
};

// Static method to get active news
newsSchema.statics.getActiveNews = function() {
  return this.find({ isActive: true }).sort({ publishedAt: -1 });
};

// Static method to get featured news
newsSchema.statics.getFeaturedNews = function() {
  return this.find({ isActive: true, isFeatured: true }).sort({ publishedAt: -1 });
};

// Static method to get news by category
newsSchema.statics.getByCategory = function(category) {
  return this.find({ isActive: true, category }).sort({ publishedAt: -1 });
};

module.exports = mongoose.model('News', newsSchema);
