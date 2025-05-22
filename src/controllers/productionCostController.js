const { ManufactureCost, ManufactureOrder, User } = require('../models');
const { Op } = require('sequelize');
const sequelize = require('../config/database');

// Get all production costs with pagination and filters
exports.getAllProductionCosts = async (req, res) => {
  try {
    const { page = 1, limit = 10, order_id, cost_type } = req.query;
    const offset = (page - 1) * limit;
    
    // Build filter condition
    const where = {};
    if (order_id) where.order_id = order_id;
    if (cost_type) where.cost_type = cost_type;
    
    // Find production costs with pagination
    const { count, rows } = await ManufactureCost.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset: parseInt(offset),
      include: [
        {
          model: ManufactureOrder,
          attributes: ['order_id', 'order_number', 'product_id', 'status']
        },
        {
          model: User,
          as: 'CreatedByUser',
          attributes: ['user_id', 'username']
        }
      ],
      order: [['cost_id', 'DESC']]
    });
    
    return res.status(200).json({
      costs: rows,
      total: count,
      page: parseInt(page),
      limit: parseInt(limit)
    });
  } catch (error) {
    console.error('Error getting production costs:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// Create new production cost
exports.createProductionCost = async (req, res) => {
  // Transaction to ensure data consistency
  const t = await sequelize.transaction();
  
  try {
    const { order_id, cost_type, amount, notes } = req.body;
    
    // Validate required fields
    if (!order_id || !cost_type || !amount) {
      await t.rollback();
      return res.status(400).json({ message: 'order_id, cost_type, and amount are required' });
    }
    
    // Validate cost_type
    const validCostTypes = ['material', 'labor', 'overhead', 'other'];
    if (!validCostTypes.includes(cost_type)) {
      await t.rollback();
      return res.status(400).json({ message: `Invalid cost_type. Must be one of: ${validCostTypes.join(', ')}` });
    }
    
    // Validate order_id
    const order = await ManufactureOrder.findByPk(order_id);
    if (!order) {
      await t.rollback();
      return res.status(400).json({ message: 'Invalid order_id' });
    }
    
    // Validate amount
    if (isNaN(amount) || amount <= 0) {
      await t.rollback();
      return res.status(400).json({ message: 'Amount must be a positive number' });
    }
    
    // Create new production cost
    const newCost = await ManufactureCost.create({
      order_id,
      cost_type,
      amount,
      cost_date: new Date(),
      notes,
      created_by: req.user ? req.user.user_id : null
    }, { transaction: t });
    
    await t.commit();
    
    // Get the created cost with details
    const createdCost = await ManufactureCost.findByPk(newCost.cost_id, {
      include: [
        {
          model: ManufactureOrder,
          attributes: ['order_id', 'order_number', 'product_id', 'status']
        },
        {
          model: User,
          as: 'CreatedByUser',
          attributes: ['user_id', 'username']
        }
      ]
    });
    
    return res.status(201).json(createdCost);
  } catch (error) {
    await t.rollback();
    console.error('Error creating production cost:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}; 