const User = require('../models/User');
const bcrypt = require('bcryptjs');

class UserController {
  // Get all users (admin only)
  async getAllUsers(req, res) {
    try {
      const { page = 1, limit = 10, role, search } = req.query;
      const skip = (page - 1) * limit;

      // Build query
      let query = {};
      
      if (role) {
        query.role = role;
      }
      
      if (search) {
        query.$or = [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } }
        ];
      }

      const users = await User.find(query)
        .select('-password -resetPasswordToken -resetPasswordExpires')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean();

      const total = await User.countDocuments(query);

      res.json({
        success: true,
        data: {
          users,
          pagination: {
            current: parseInt(page),
            pages: Math.ceil(total / limit),
            total,
            limit: parseInt(limit)
          }
        }
      });
    } catch (error) {
      console.error('Get all users error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Server error while fetching users' 
      });
    }
  }

  // Get single user by ID (admin only)
  async getUserById(req, res) {
    try {
      const { id } = req.params;
      const user = await User.findById(id)
        .select('-password -resetPasswordToken -resetPasswordExpires');

      if (!user) {
        return res.status(404).json({ 
          success: false, 
          message: 'User not found' 
        });
      }

      res.json({
        success: true,
        data: { user }
      });
    } catch (error) {
      console.error('Get user by ID error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Server error while fetching user' 
      });
    }
  }

  // Create new user (admin only)
  async createUser(req, res) {
    try {
      const { name, email, password, role = 'user' } = req.body;

      if (!name || !email || !password) {
        return res.status(400).json({ 
          success: false, 
          message: 'Name, email, and password are required' 
        });
      }

      // Check if user already exists
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ 
          success: false, 
          message: 'User with this email already exists' 
        });
      }

      // Hash password
      const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 10;
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      const user = new User({
        name,
        email,
        password: hashedPassword,
        role
      });

      await user.save();

      res.status(201).json({
        success: true,
        message: 'User created successfully',
        data: { user: user.toSafeObject() }
      });
    } catch (error) {
      console.error('Create user error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Server error while creating user' 
      });
    }
  }

  // Update user (admin only)
  async updateUser(req, res) {
    try {
      const { id } = req.params;
      const { name, email, role, password } = req.body;

      const user = await User.findById(id);
      if (!user) {
        return res.status(404).json({ 
          success: false, 
          message: 'User not found' 
        });
      }

      // Check if email is being changed and if it's already taken
      if (email && email !== user.email) {
        const existingUser = await User.findOne({ email });
        if (existingUser) {
          return res.status(400).json({ 
            success: false, 
            message: 'Email is already taken' 
          });
        }
        user.email = email;
      }

      if (name) user.name = name;
      if (role) user.role = role;

      // Update password if provided
      if (password) {
        const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 10;
        user.password = await bcrypt.hash(password, saltRounds);
      }

      await user.save();

      res.json({
        success: true,
        message: 'User updated successfully',
        data: { user: user.toSafeObject() }
      });
    } catch (error) {
      console.error('Update user error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Server error while updating user' 
      });
    }
  }

  // Delete user (admin only)
  async deleteUser(req, res) {
    try {
      const { id } = req.params;

      // Prevent admin from deleting themselves
      if (id === req.user.userId) {
        return res.status(400).json({ 
          success: false, 
          message: 'You cannot delete your own account' 
        });
      }

      const user = await User.findById(id);
      if (!user) {
        return res.status(404).json({ 
          success: false, 
          message: 'User not found' 
        });
      }

      await User.findByIdAndDelete(id);

      res.json({
        success: true,
        message: 'User deleted successfully'
      });
    } catch (error) {
      console.error('Delete user error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Server error while deleting user' 
      });
    }
  }

  // Get users by role
  async getUsersByRole(req, res) {
    try {
      const { role } = req.params;
      const { page = 1, limit = 10 } = req.query;
      const skip = (page - 1) * limit;

      if (!['user', 'admin'].includes(role)) {
        return res.status(400).json({ 
          success: false, 
          message: 'Invalid role' 
        });
      }

      const users = await User.find({ role })
        .select('-password -resetPasswordToken -resetPasswordExpires')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean();

      const total = await User.countDocuments({ role });

      res.json({
        success: true,
        data: {
          users,
          role,
          pagination: {
            current: parseInt(page),
            pages: Math.ceil(total / limit),
            total,
            limit: parseInt(limit)
          }
        }
      });
    } catch (error) {
      console.error('Get users by role error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Server error while fetching users by role' 
      });
    }
  }

  // Get all admins
  async getAllAdmins(req, res) {
    try {
      const admins = await User.find({ role: 'admin' })
        .select('-password -resetPasswordToken -resetPasswordExpires')
        .sort({ createdAt: -1 })
        .lean();

      res.json({
        success: true,
        data: { admins }
      });
    } catch (error) {
      console.error('Get all admins error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Server error while fetching admins' 
      });
    }
  }

  // Get user statistics (admin only)
  async getUserStats(req, res) {
    try {
      const totalUsers = await User.countDocuments();
      const totalAdmins = await User.countDocuments({ role: 'admin' });
      const totalRegularUsers = await User.countDocuments({ role: 'user' });

      // Get users created in the last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const recentUsers = await User.countDocuments({
        createdAt: { $gte: thirtyDaysAgo }
      });

      // Get users by month for the last 6 months
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

      const usersByMonth = await User.aggregate([
        {
          $match: {
            createdAt: { $gte: sixMonthsAgo }
          }
        },
        {
          $group: {
            _id: {
              year: { $year: '$createdAt' },
              month: { $month: '$createdAt' }
            },
            count: { $sum: 1 }
          }
        },
        {
          $sort: { '_id.year': 1, '_id.month': 1 }
        }
      ]);

      res.json({
        success: true,
        data: {
          totalUsers,
          totalAdmins,
          totalRegularUsers,
          recentUsers,
          usersByMonth
        }
      });
    } catch (error) {
      console.error('Get user stats error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Server error while fetching user statistics' 
      });
    }
  }

  // Toggle user status (admin only)
  async toggleUserStatus(req, res) {
    try {
      const { id } = req.params;

      // Prevent admin from deactivating themselves
      if (id === req.user.userId) {
        return res.status(400).json({ 
          success: false, 
          message: 'You cannot deactivate your own account' 
        });
      }

      const user = await User.findById(id);
      if (!user) {
        return res.status(404).json({ 
          success: false, 
          message: 'User not found' 
        });
      }

      // Toggle isActive status (assuming we add this field to the schema)
      user.isActive = !user.isActive;
      await user.save();

      res.json({
        success: true,
        message: `User ${user.isActive ? 'activated' : 'deactivated'} successfully`,
        data: { user: user.toSafeObject() }
      });
    } catch (error) {
      console.error('Toggle user status error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Server error while toggling user status' 
      });
    }
  }
}

module.exports = new UserController();
