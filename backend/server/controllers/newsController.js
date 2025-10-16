const News = require('../models/News');

class NewsController {
  // Get all news (public)
  async getAllNews(req, res) {
    try {
      const { page = 1, limit = 10, category, featured, search } = req.query;
      const skip = (page - 1) * limit;

      // Build query
      let query = { isActive: true };
      
      if (category) {
        query.category = category;
      }
      
      if (featured === 'true') {
        query.isFeatured = true;
      }
      
      if (search) {
        query.$or = [
          { title: { $regex: search, $options: 'i' } },
          { content: { $regex: search, $options: 'i' } },
          { author: { $regex: search, $options: 'i' } },
          { tags: { $in: [new RegExp(search, 'i')] } }
        ];
      }

      const news = await News.find(query)
        .sort({ publishedAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean();

      const total = await News.countDocuments(query);

      res.json({
        success: true,
        data: {
          news,
          pagination: {
            current: parseInt(page),
            pages: Math.ceil(total / limit),
            total,
            limit: parseInt(limit)
          }
        }
      });
    } catch (error) {
      console.error('Get all news error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Server error while fetching news' 
      });
    }
  }

  // Get single news by ID
  async getNewsById(req, res) {
    try {
      const { id } = req.params;
      const news = await News.findById(id);

      if (!news) {
        return res.status(404).json({ 
          success: false, 
          message: 'News article not found' 
        });
      }

      if (!news.isActive) {
        return res.status(404).json({ 
          success: false, 
          message: 'News article not found' 
        });
      }

      // Increment view count
      await news.incrementViewCount();

      res.json({
        success: true,
        data: { news }
      });
    } catch (error) {
      console.error('Get news by ID error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Server error while fetching news' 
      });
    }
  }

  // Create new news (admin only)
  async createNews(req, res) {
    try {
      const { title, content, category = 'business', author, imageUrl, isFeatured = false, tags } = req.body;

      if (!title || !content || !author) {
        return res.status(400).json({ 
          success: false, 
          message: 'Title, content, and author are required' 
        });
      }

      const newsData = {
        title,
        content,
        author,
        category,
        imageUrl: imageUrl || '',
        isFeatured: Boolean(isFeatured),
        tags: tags ? tags.split(',').map(tag => tag.trim()) : []
      };

      const news = new News(newsData);
      await news.save();

      res.status(201).json({
        success: true,
        message: 'News article created successfully',
        data: { news }
      });
    } catch (error) {
      console.error('Create news error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Server error while creating news' 
      });
    }
  }

  // Update news (admin only)
  async updateNews(req, res) {
    try {
      const { id } = req.params;
      const { title, content, author, category, imageUrl, isFeatured, isActive, tags } = req.body;

      const news = await News.findById(id);
      if (!news) {
        return res.status(404).json({ 
          success: false, 
          message: 'News article not found' 
        });
      }

      // Update fields
      if (title) news.title = title;
      if (content) news.content = content;
      if (author) news.author = author;
      if (category) news.category = category;
      if (imageUrl !== undefined) news.imageUrl = imageUrl;
      if (typeof isFeatured === 'boolean') news.isFeatured = isFeatured;
      if (typeof isActive === 'boolean') news.isActive = isActive;
      if (tags) news.tags = tags.split(',').map(tag => tag.trim());

      await news.save();

      res.json({
        success: true,
        message: 'News article updated successfully',
        data: { news }
      });
    } catch (error) {
      console.error('Update news error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Server error while updating news' 
      });
    }
  }

  // Delete news (admin only)
  async deleteNews(req, res) {
    try {
      const { id } = req.params;
      const news = await News.findById(id);

      if (!news) {
        return res.status(404).json({ 
          success: false, 
          message: 'News article not found' 
        });
      }

      await News.findByIdAndDelete(id);

      res.json({
        success: true,
        message: 'News article deleted successfully'
      });
    } catch (error) {
      console.error('Delete news error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Server error while deleting news' 
      });
    }
  }

  // Get featured news
  async getFeaturedNews(req, res) {
    try {
      const { limit = 5 } = req.query;
      const news = await News.getFeaturedNews().limit(parseInt(limit));

      res.json({
        success: true,
        data: { news }
      });
    } catch (error) {
      console.error('Get featured news error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Server error while fetching featured news' 
      });
    }
  }

  // Get news by category
  async getNewsByCategory(req, res) {
    try {
      const { category } = req.params;
      const { page = 1, limit = 10 } = req.query;
      const skip = (page - 1) * limit;

      if (!['business', 'policy', 'event', 'announcement'].includes(category)) {
        return res.status(400).json({ 
          success: false, 
          message: 'Invalid category' 
        });
      }

      const news = await News.find({ 
        isActive: true, 
        category 
      })
        .sort({ publishedAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean();

      const total = await News.countDocuments({ 
        isActive: true, 
        category 
      });

      res.json({
        success: true,
        data: {
          news,
          category,
          pagination: {
            current: parseInt(page),
            pages: Math.ceil(total / limit),
            total,
            limit: parseInt(limit)
          }
        }
      });
    } catch (error) {
      console.error('Get news by category error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Server error while fetching news by category' 
      });
    }
  }

  // Search news
  async searchNews(req, res) {
    try {
      const { q, page = 1, limit = 10 } = req.query;
      const skip = (page - 1) * limit;

      if (!q) {
        return res.status(400).json({ 
          success: false, 
          message: 'Search query is required' 
        });
      }

      const query = {
        isActive: true,
        $or: [
          { title: { $regex: q, $options: 'i' } },
          { content: { $regex: q, $options: 'i' } },
          { author: { $regex: q, $options: 'i' } },
          { tags: { $in: [new RegExp(q, 'i')] } }
        ]
      };

      const news = await News.find(query)
        .sort({ publishedAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean();

      const total = await News.countDocuments(query);

      res.json({
        success: true,
        data: {
          news,
          query: q,
          pagination: {
            current: parseInt(page),
            pages: Math.ceil(total / limit),
            total,
            limit: parseInt(limit)
          }
        }
      });
    } catch (error) {
      console.error('Search news error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Server error while searching news' 
      });
    }
  }

  // Get news statistics (admin only)
  async getNewsStats(req, res) {
    try {
      const totalNews = await News.countDocuments();
      const activeNews = await News.countDocuments({ isActive: true });
      const featuredNews = await News.countDocuments({ isFeatured: true });

      const categoryStats = await News.aggregate([
        {
          $group: {
            _id: '$category',
            count: { $sum: 1 }
          }
        }
      ]);

      const totalViews = await News.aggregate([
        {
          $group: {
            _id: null,
            totalViews: { $sum: '$viewCount' }
          }
        }
      ]);

      res.json({
        success: true,
        data: {
          totalNews,
          activeNews,
          featuredNews,
          categoryBreakdown: categoryStats,
          totalViews: totalViews[0]?.totalViews || 0
        }
      });
    } catch (error) {
      console.error('Get news stats error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Server error while fetching news statistics' 
      });
    }
  }
}

module.exports = new NewsController();
