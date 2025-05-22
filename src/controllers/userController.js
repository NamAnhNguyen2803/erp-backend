const { User } = require('../models');
const { Op } = require('sequelize');

// Get all users with pagination and filters
exports.getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 10, role, is_active } = req.query;
    const offset = (page - 1) * limit;
    
    // Build filter condition
    const where = {};
    if (role) where.role = role;
    if (is_active !== undefined) where.is_active = is_active === 'true';
    
    // Find users with pagination
    const { count, rows } = await User.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset: parseInt(offset),
      attributes: ['user_id', 'username', 'role', 'is_active'],
      order: [['user_id', 'DESC']]
    });
    
    return res.status(200).json({
      users: rows,
      total: count,
      page: parseInt(page),
      limit: parseInt(limit)
    });
  } catch (error) {
    console.error('Error getting users:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// Get user by ID
exports.getUserById = async (req, res) => {
  try {
    const { user_id } = req.params;
    const user = await User.findByPk(user_id, {
      attributes: ['user_id', 'username', 'role', 'is_active']
    });
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    return res.status(200).json(user);
  } catch (error) {
    console.error('Error getting user:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// Create new user
exports.createUser = async (req, res) => {
  try {
    const { username, password, role, is_active } = req.body;
    
    // Check if username already exists
    const existingUser = await User.findOne({ where: { username } });
    if (existingUser) {
      return res.status(400).json({ message: 'Username already exists' });
    }
    
    // Create new user
    const newUser = await User.create({
      username,
      password,
      role,
      is_active
    });
    
    return res.status(201).json({
      user_id: newUser.user_id,
      username: newUser.username,
      role: newUser.role,
      is_active: newUser.is_active
    });
  } catch (error) {
    console.error('Error creating user:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// Update user
exports.updateUser = async (req, res) => {
  try {
    const { user_id } = req.params;
    const { username, password, role, is_active } = req.body;
    
    // Find user by ID
    const user = await User.findByPk(user_id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Check if updating username and if it already exists
    if (username && username !== user.username) {
      const existingUser = await User.findOne({ where: { username } });
      if (existingUser) {
        return res.status(400).json({ message: 'Username already exists' });
      }
    }
    
    // Update user fields
    if (username) user.username = username;
    if (password) user.password = password;
    if (role) user.role = role;
    if (is_active !== undefined) user.is_active = is_active;
    
    await user.save();
    
    return res.status(200).json({
      user_id: user.user_id,
      username: user.username,
      role: user.role,
      is_active: user.is_active
    });
  } catch (error) {
    console.error('Error updating user:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// Delete user
exports.deleteUser = async (req, res) => {
  try {
    const { user_id } = req.params;
    
    // Find user by ID
    const user = await User.findByPk(user_id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Soft delete (change is_active to false)
    user.is_active = false;
    await user.save();
    
    return res.status(200).json({ message: 'User deleted' });
  } catch (error) {
    console.error('Error deleting user:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}; 