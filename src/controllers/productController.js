const { Product } = require('../models');
const { Op } = require('sequelize');

// Get all products with pagination and filters
exports.getAllProducts = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, min_stock, max_stock } = req.query;
    const offset = (page - 1) * limit;
    
    // Build filter condition
    const where = {};
    if (status) where.status = status;
    if (min_stock) where.current_stock = { [Op.gte]: parseFloat(min_stock) };
    if (max_stock) where.current_stock = { 
      ...where.current_stock,
      [Op.lte]: parseFloat(max_stock) 
    };
    
    // Find products with pagination
    const { count, rows } = await Product.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset: parseInt(offset),
      attributes: ['product_id', 'code', 'name', 'specification', 'unit', 'current_stock', 'cost_price', 'status'],
      order: [['product_id', 'DESC']]
    });
    
    return res.status(200).json({
      products: rows,
      total: count,
      page: parseInt(page),
      limit: parseInt(limit)
    });
  } catch (error) {
    console.error('Error getting products:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// Get product by ID
exports.getProductById = async (req, res) => {
  try {
    const { product_id } = req.params;
    const product = await Product.findByPk(product_id);
    
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    return res.status(200).json(product);
  } catch (error) {
    console.error('Error getting product:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// Create new product
exports.createProduct = async (req, res) => {
  try {
    const { code, name, specification, unit, min_stock, max_stock, cost_price, status } = req.body;
    
    // Check if code already exists
    const existingProduct = await Product.findOne({ where: { code } });
    if (existingProduct) {
      return res.status(400).json({ message: 'Product code already exists' });
    }
    
    // Create new product
    const newProduct = await Product.create({
      code,
      name,
      specification,
      unit,
      min_stock,
      max_stock,
      current_stock: 0, // Initialize with 0 stock
      cost_price,
      status
    });
    
    return res.status(201).json(newProduct);
  } catch (error) {
    console.error('Error creating product:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// Update product
exports.updateProduct = async (req, res) => {
  try {
    const { product_id } = req.params;
    const { code, name, specification, unit, min_stock, max_stock, current_stock, cost_price, status } = req.body;
    
    // Find product by ID
    const product = await Product.findByPk(product_id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    // Check if updating code and if it already exists
    if (code && code !== product.code) {
      const existingProduct = await Product.findOne({ where: { code } });
      if (existingProduct) {
        return res.status(400).json({ message: 'Product code already exists' });
      }
    }
    
    // Update product fields
    await product.update({
      code: code || product.code,
      name: name || product.name,
      specification: specification !== undefined ? specification : product.specification,
      unit: unit || product.unit,
      min_stock: min_stock !== undefined ? min_stock : product.min_stock,
      max_stock: max_stock !== undefined ? max_stock : product.max_stock,
      current_stock: current_stock !== undefined ? current_stock : product.current_stock,
      cost_price: cost_price !== undefined ? cost_price : product.cost_price,
      status: status || product.status
    });
    
    return res.status(200).json(product);
  } catch (error) {
    console.error('Error updating product:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// Delete product
exports.deleteProduct = async (req, res) => {
  try {
    const { product_id } = req.params;
    
    // Find product by ID
    const product = await Product.findByPk(product_id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    // Check if product is referenced in other tables before deleting
    // For this example, we're using a soft delete by changing status to 'inactive'
    product.status = 'inactive';
    await product.save();
    
    // For hard delete, uncomment this line:
    // await product.destroy();
    
    return res.status(200).json({ message: 'Product deleted' });
  } catch (error) {
    console.error('Error deleting product:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}; 