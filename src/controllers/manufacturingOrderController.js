const { ManufactureOrder, ManufacturePlan, Product, BOM, User } = require('../models');
const { Op } = require('sequelize');
const sequelize = require('../config/database');

// Get all manufacturing orders with pagination and filters
exports.getAllManufacturingOrders = async (req, res) => {
  try {
    const { page = 1, limit = 10, plan_id, status } = req.query;
    const offset = (page - 1) * limit;
    
    // Build filter condition
    const where = {};
    if (plan_id) where.plan_id = plan_id;
    if (status) where.status = status;
    
    // Find manufacturing orders with pagination
    const { count, rows } = await ManufactureOrder.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset: parseInt(offset),
      include: [
        {
          model: Product,
          attributes: ['product_id', 'code', 'name', 'unit']
        },
        {
          model: ManufacturePlan,
          attributes: ['plan_id', 'plan_code', 'status']
        },
        {
          model: BOM,
          attributes: ['bom_id', 'version']
        },
        {
          model: User,
          attributes: ['user_id', 'username']
        }
      ],
      order: [['order_id', 'DESC']]
    });
    
    return res.status(200).json({
      orders: rows,
      total: count,
      page: parseInt(page),
      limit: parseInt(limit)
    });
  } catch (error) {
    console.error('Error getting manufacturing orders:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// Get manufacturing order by ID
exports.getManufacturingOrderById = async (req, res) => {
  try {
    const { order_id } = req.params;
    const order = await ManufactureOrder.findByPk(order_id, {
      include: [
        {
          model: Product,
          attributes: ['product_id', 'code', 'name', 'unit', 'specification']
        },
        {
          model: ManufacturePlan,
          attributes: ['plan_id', 'plan_code', 'description', 'status']
        },
        {
          model: BOM,
          attributes: ['bom_id', 'version']
        },
        {
          model: User,
          attributes: ['user_id', 'username']
        }
      ]
    });
    
    if (!order) {
      return res.status(404).json({ message: 'manufacturing order not found' });
    }
    
    return res.status(200).json(order);
  } catch (error) {
    console.error('Error getting manufacturing order:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// Create new manufacturing order
exports.createManufacturingOrder = async (req, res) => {
  // Transaction to ensure data consistency
  const t = await sequelize.transaction();
  
  try {
    const { order_number, plan_id, product_id, bom_id, quantity, start_date, end_date, status, created_by } = req.body;
    
    // Validate plan_id if provided
    if (plan_id) {
      const plan = await ManufacturePlan.findByPk(plan_id);
      if (!plan) {
        await t.rollback();
        return res.status(400).json({ message: 'Invalid plan_id' });
      }
    }
    
    // Validate product_id
    const product = await Product.findByPk(product_id);
    if (!product) {
      await t.rollback();
      return res.status(400).json({ message: 'Invalid product_id' });
    }
    
    // Validate bom_id if provided
    if (bom_id) {
      const bom = await BOM.findByPk(bom_id);
      if (!bom) {
        await t.rollback();
        return res.status(400).json({ message: 'Invalid bom_id' });
      }
      
      // Check if BOM is for the specified product
      if (bom.product_id !== product_id) {
        await t.rollback();
        return res.status(400).json({ message: 'BOM does not match the specified product' });
      }
    }
    
    // Validate user_id (created_by)
    const user = await User.findByPk(created_by);
    if (!user) {
      await t.rollback();
      return res.status(400).json({ message: 'Invalid created_by user_id' });
    }
    
    // Check if order_number already exists
    const existingOrder = await ManufactureOrder.findOne({
      where: { order_number }
    });
    
    if (existingOrder) {
      await t.rollback();
      return res.status(400).json({ message: 'Order number already exists' });
    }
    
    // Create new manufacturing order
    const newOrder = await ManufactureOrder.create({
      order_number,
      plan_id,
      product_id,
      bom_id,
      quantity,
      start_date: start_date ? new Date(start_date) : null,
      end_date: end_date ? new Date(end_date) : null,
      status,
      created_by,
      created_at: new Date()
    }, { transaction: t });
    
    await t.commit();
    
    // Get the created order with details
    const createdOrder = await ManufactureOrder.findByPk(newOrder.order_id, {
      include: [
        {
          model: Product,
          attributes: ['product_id', 'code', 'name', 'unit']
        },
        {
          model: ManufacturePlan,
          attributes: ['plan_id', 'plan_code', 'status']
        },
        {
          model: BOM,
          attributes: ['bom_id', 'version']
        },
        {
          model: User,
          attributes: ['user_id', 'username']
        }
      ]
    });
    
    return res.status(201).json(createdOrder);
  } catch (error) {
    await t.rollback();
    console.error('Error creating manufacturing order:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// Update manufacturing order
exports.updateManufacturingOrder = async (req, res) => {
  // Transaction to ensure data consistency
  const t = await sequelize.transaction();
  
  try {
    const { order_id } = req.params;
    const { quantity, start_date, end_date, status, total_cost } = req.body;
    
    // Find order by ID
    const order = await ManufactureOrder.findByPk(order_id);
    if (!order) {
      await t.rollback();
      return res.status(404).json({ message: 'manufacturing order not found' });
    }
    
    // Update order fields
    await order.update({
      quantity: quantity !== undefined ? quantity : order.quantity,
      start_date: start_date ? new Date(start_date) : order.start_date,
      end_date: end_date ? new Date(end_date) : order.end_date,
      status: status || order.status,
      total_cost: total_cost !== undefined ? total_cost : order.total_cost
    }, { transaction: t });
    
    await t.commit();
    
    // Get the updated order with details
    const updatedOrder = await ManufactureOrder.findByPk(order_id, {
      include: [
        {
          model: Product,
          attributes: ['product_id', 'code', 'name', 'unit']
        },
        {
          model: ManufacturePlan,
          attributes: ['plan_id', 'plan_code', 'status']
        },
        {
          model: BOM,
          attributes: ['bom_id', 'version']
        },
        {
          model: User,
          attributes: ['user_id', 'username']
        }
      ]
    });
    
    return res.status(200).json(updatedOrder);
  } catch (error) {
    await t.rollback();
    console.error('Error updating manufacturing order:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}; 