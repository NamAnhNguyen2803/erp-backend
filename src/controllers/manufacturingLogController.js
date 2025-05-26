const { ManufactureLog, WorkOrder, User, ManufactureOrder, ManufactureStep } = require('../models');
const { Op } = require('sequelize');
const sequelize = require('../config/database');

// Get all manufacturing logs with pagination and filters
exports.getAllManufacturingLogs = async (req, res) => {
  try {
    const { page = 1, limit = 10, work_id, action } = req.query;
    const offset = (page - 1) * limit;
    
    // Build filter condition
    const where = {};
    if (work_id) where.work_id = work_id;
    if (action) where.action = action;
    
    // Find manufacturing logs with pagination
    const { count, rows } = await ManufactureLog.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset: parseInt(offset),
      include: [
        {
          model: WorkOrder,
          attributes: ['work_id', 'work_number', 'order_id', 'step_id', 'status'],
          include: [
            {
              model: ManufactureOrder,
              attributes: ['order_id', 'order_number', 'product_id']
            },
            {
              model: ManufactureStep,
              attributes: ['step_id', 'step_name']
            }
          ]
        },
        {
          model: User,
          as: 'CreatedByUser',
          attributes: ['user_id', 'username']
        }
      ],
      order: [['log_id', 'DESC']]
    });
    
    return res.status(200).json({
      logs: rows,
      total: count,
      page: parseInt(page),
      limit: parseInt(limit)
    });
  } catch (error) {
    console.error('Error getting manufacturing logs:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// Create new manufacturing log
exports.createManufacturingLog = async (req, res) => {
  // Transaction to ensure data consistency
  const t = await sequelize.transaction();
  
  try {
    const { work_id, action, quantity, notes } = req.body;
    
    // Validate required fields
    if (!work_id || !action) {
      await t.rollback();
      return res.status(400).json({ message: 'work_id and action are required' });
    }
    
    // Validate work_id
    const workOrder = await WorkOrder.findByPk(work_id);
    if (!workOrder) {
      await t.rollback();
      return res.status(400).json({ message: 'Invalid work_id' });
    }
    
    // Validate action
    const validActions = ['start', 'pause', 'resume', 'complete', 'issue', 'quality_check', 'rework'];
    if (!validActions.includes(action)) {
      await t.rollback();
      return res.status(400).json({ message: `Invalid action. Must be one of: ${validActions.join(', ')}` });
    }
    
    // Handle work order status changes based on action
    if (action === 'start' && workOrder.status === 'pending') {
      await workOrder.update({ 
        status: 'in_progress',
        start_time: new Date()
      }, { transaction: t });
    } 
    else if (action === 'complete' && workOrder.status === 'in_progress') {
      if (!quantity) {
        await t.rollback();
        return res.status(400).json({ message: 'Quantity is required for complete action' });
      }
      
      await workOrder.update({ 
        status: 'completed',
        end_time: new Date(),
        completed_quantity: quantity
      }, { transaction: t });
    }
    
    // Create new manufacturing log
    const newLog = await ManufactureLog.create({
      work_id,
      action,
      quantity: quantity || null,
      log_time: new Date(),
      notes,
      created_by: req.user ? req.user.user_id : null
    }, { transaction: t });
    
    await t.commit();
    
    // Get the created log with details
    const createdLog = await ManufactureLog.findByPk(newLog.log_id, {
      include: [
        {
          model: WorkOrder,
          attributes: ['work_id', 'work_number', 'order_id', 'step_id', 'status'],
          include: [
            {
              model: ManufactureOrder,
              attributes: ['order_id', 'order_number']
            },
            {
              model: ManufactureStep,
              attributes: ['step_id', 'step_name']
            }
          ]
        },
        {
          model: User,
          as: 'CreatedByUser',
          attributes: ['user_id', 'username']
        }
      ]
    });
    
    return res.status(201).json(createdLog);
  } catch (error) {
    await t.rollback();
    console.error('Error creating manufacturing log:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}; 