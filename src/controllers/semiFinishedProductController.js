const { SemiFinishedProduct } = require('../models');
const { Op } = require('sequelize');

// Get all semi-finished products with pagination and filters
exports.getAllSemiFinishedProducts = async (req, res) => {
  try {
    const { page = 1, limit = 10, phase } = req.query;
    const offset = (page - 1) * limit;
    
    // Build filter condition
    const where = {};
    if (phase) where.phase = phase;
    
    // Find semi-finished products with pagination
    const { count, rows } = await SemiFinishedProduct.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset: parseInt(offset),
      attributes: ['semi_product_id', 'code', 'name', 'unit', 'specification', 'current_stock', 'phase'],
      order: [['semi_product_id', 'DESC']]
    });
    
    return res.status(200).json({
      semi_products: rows,
      total: count,
      page: parseInt(page),
      limit: parseInt(limit)
    });
  } catch (error) {
    console.error('Error getting semi-finished products:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// Get semi-finished product by ID
exports.getSemiFinishedProductById = async (req, res) => {
  try {
    const { semi_product_id } = req.params;
    const semiProduct = await SemiFinishedProduct.findByPk(semi_product_id);
    
    if (!semiProduct) {
      return res.status(404).json({ message: 'Semi-finished product not found' });
    }
    
    return res.status(200).json(semiProduct);
  } catch (error) {
    console.error('Error getting semi-finished product:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// Create new semi-finished product
exports.createSemiFinishedProduct = async (req, res) => {
  try {
    const { code, name, unit, specification, phase } = req.body;
    
    // Check if code already exists
    const existingSemiProduct = await SemiFinishedProduct.findOne({ where: { code } });
    if (existingSemiProduct) {
      return res.status(400).json({ message: 'Semi-finished product code already exists' });
    }
    
    // Create new semi-finished product
    const newSemiProduct = await SemiFinishedProduct.create({
      code,
      name,
      unit,
      specification,
      current_stock: 0, // Initialize with 0 stock
      phase
    });
    
    return res.status(201).json(newSemiProduct);
  } catch (error) {
    console.error('Error creating semi-finished product:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// Update semi-finished product
exports.updateSemiFinishedProduct = async (req, res) => {
  try {
    const { semi_product_id } = req.params;
    const { code, name, unit, specification, current_stock, phase } = req.body;
    
    // Find semi-finished product by ID
    const semiProduct = await SemiFinishedProduct.findByPk(semi_product_id);
    if (!semiProduct) {
      return res.status(404).json({ message: 'Semi-finished product not found' });
    }
    
    // Check if updating code and if it already exists
    if (code && code !== semiProduct.code) {
      const existingSemiProduct = await SemiFinishedProduct.findOne({ where: { code } });
      if (existingSemiProduct) {
        return res.status(400).json({ message: 'Semi-finished product code already exists' });
      }
    }
    
    // Update semi-finished product fields
    await semiProduct.update({
      code: code || semiProduct.code,
      name: name || semiProduct.name,
      unit: unit || semiProduct.unit,
      specification: specification !== undefined ? specification : semiProduct.specification,
      current_stock: current_stock !== undefined ? current_stock : semiProduct.current_stock,
      phase: phase || semiProduct.phase
    });
    
    return res.status(200).json(semiProduct);
  } catch (error) {
    console.error('Error updating semi-finished product:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// Delete semi-finished product
exports.deleteSemiFinishedProduct = async (req, res) => {
  try {
    const { semi_product_id } = req.params;
    
    // Find semi-finished product by ID
    const semiProduct = await SemiFinishedProduct.findByPk(semi_product_id);
    if (!semiProduct) {
      return res.status(404).json({ message: 'Semi-finished product not found' });
    }
    
    // Delete semi-finished product (hard delete)
    await semiProduct.destroy();
    
    return res.status(200).json({ message: 'Semi-finished product deleted' });
  } catch (error) {
    console.error('Error deleting semi-finished product:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}; 