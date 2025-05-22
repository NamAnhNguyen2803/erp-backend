const { WorkOrder, ManufactureOrder, ManufactureStep, WorkStation, SemiFinishedProduct, User, MaterialRequirement, BOM, Inventory, InventoryTransaction } = require('../models');
const { Op } = require('sequelize');
const sequelize = require('../config/database');
const bomController = require('./bomController');

// Get all work orders with pagination and filters
exports.getAllWorkOrders = async (req, res) => {
  try {
    const { page = 1, limit = 10, order_id, status, station_id } = req.query;
    const offset = (page - 1) * limit;
    
    // Build filter condition
    const where = {};
    if (order_id) where.order_id = order_id;
    if (status) where.status = status;
    if (station_id) where.station_id = station_id;
    
    // Find work orders with pagination
    const { count, rows } = await WorkOrder.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset: parseInt(offset),
      include: [
        {
          model: ManufactureOrder,
          attributes: ['order_id', 'order_number', 'product_id', 'status']
        },
        {
          model: ManufactureStep,
          attributes: ['step_id', 'step_name', 'step_description']
        },
        {
          model: WorkStation,
          attributes: ['station_id', 'code', 'name']
        },
        {
          model: SemiFinishedProduct,
          attributes: ['semi_product_id', 'code', 'name']
        },
        {
          model: User,
          attributes: ['user_id', 'username'],
          as: 'AssignedUser'
        }
      ],
      order: [['work_id', 'DESC']]
    });
    
    return res.status(200).json({
      work_orders: rows,
      total: count,
      page: parseInt(page),
      limit: parseInt(limit)
    });
  } catch (error) {
    console.error('Error getting work orders:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// Get work order by ID
exports.getWorkOrderById = async (req, res) => {
  try {
    const { work_id } = req.params;
    const workOrder = await WorkOrder.findByPk(work_id, {
      include: [
        {
          model: ManufactureOrder,
          attributes: ['order_id', 'order_number', 'product_id', 'status']
        },
        {
          model: ManufactureStep,
          attributes: ['step_id', 'step_name', 'step_description']
        },
        {
          model: WorkStation,
          attributes: ['station_id', 'code', 'name']
        },
        {
          model: SemiFinishedProduct,
          attributes: ['semi_product_id', 'code', 'name', 'unit']
        },
        {
          model: User,
          attributes: ['user_id', 'username'],
          as: 'AssignedUser'
        },
        {
          model: MaterialRequirement,
          attributes: ['requirement_id', 'material_id', 'required_quantity', 'issued_quantity']
        }
      ]
    });
    
    if (!workOrder) {
      return res.status(404).json({ message: 'Work order not found' });
    }
    
    return res.status(200).json(workOrder);
  } catch (error) {
    console.error('Error getting work order:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// Create new work order
exports.createWorkOrder = async (req, res) => {
  // Transaction to ensure data consistency
  const t = await sequelize.transaction();
  
  try {
    const { work_number, order_id, step_id, station_id, semi_product_id, planned_quantity, status, assigned_to } = req.body;
    
    // Validate order_id
    const order = await ManufactureOrder.findByPk(order_id);
    if (!order) {
      await t.rollback();
      return res.status(400).json({ message: 'Invalid order_id' });
    }
    
    // Validate step_id
    const step = await ManufactureStep.findByPk(step_id);
    if (!step) {
      await t.rollback();
      return res.status(400).json({ message: 'Invalid step_id' });
    }
    
    // Validate station_id
    const station = await WorkStation.findByPk(station_id);
    if (!station) {
      await t.rollback();
      return res.status(400).json({ message: 'Invalid station_id' });
    }
    
    // Validate semi_product_id if provided
    if (semi_product_id) {
      const semiProduct = await SemiFinishedProduct.findByPk(semi_product_id);
      if (!semiProduct) {
        await t.rollback();
        return res.status(400).json({ message: 'Invalid semi_product_id' });
      }
    }
    
    // Validate assigned_to if provided
    if (assigned_to) {
      const user = await User.findByPk(assigned_to);
      if (!user) {
        await t.rollback();
        return res.status(400).json({ message: 'Invalid assigned_to user_id' });
      }
    }
    
    // Check if work_number already exists
    const existingWorkOrder = await WorkOrder.findOne({
      where: { work_number }
    });
    
    if (existingWorkOrder) {
      await t.rollback();
      return res.status(400).json({ message: 'Work number already exists' });
    }
    
    // Create new work order
    const newWorkOrder = await WorkOrder.create({
      work_number,
      order_id,
      step_id,
      station_id,
      semi_product_id,
      planned_quantity,
      completed_quantity: 0,
      start_time: null,
      end_time: null,
      status: status || 'pending',
      assigned_to
    }, { transaction: t });
    
    await t.commit();
    
    // Get the created work order with details
    const createdWorkOrder = await WorkOrder.findByPk(newWorkOrder.work_id, {
      include: [
        {
          model: ManufactureOrder,
          attributes: ['order_id', 'order_number', 'product_id', 'status']
        },
        {
          model: ManufactureStep,
          attributes: ['step_id', 'step_name', 'step_description']
        },
        {
          model: WorkStation,
          attributes: ['station_id', 'code', 'name']
        },
        {
          model: SemiFinishedProduct,
          attributes: ['semi_product_id', 'code', 'name']
        },
        {
          model: User,
          attributes: ['user_id', 'username'],
          as: 'AssignedUser'
        }
      ]
    });
    
    return res.status(201).json(createdWorkOrder);
  } catch (error) {
    await t.rollback();
    console.error('Error creating work order:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// Update work order
exports.updateWorkOrder = async (req, res) => {
  // Transaction to ensure data consistency
  const t = await sequelize.transaction();
  
  try {
    const { work_id } = req.params;
    const { planned_quantity, completed_quantity, start_time, end_time, status } = req.body;
    
    // Find work order by ID
    const workOrder = await WorkOrder.findByPk(work_id);
    if (!workOrder) {
      await t.rollback();
      return res.status(404).json({ message: 'Work order not found' });
    }
    
    // Update work order fields
    await workOrder.update({
      planned_quantity: planned_quantity !== undefined ? planned_quantity : workOrder.planned_quantity,
      completed_quantity: completed_quantity !== undefined ? completed_quantity : workOrder.completed_quantity,
      start_time: start_time ? new Date(start_time) : workOrder.start_time,
      end_time: end_time ? new Date(end_time) : workOrder.end_time,
      status: status || workOrder.status
    }, { transaction: t });
    
    await t.commit();
    
    // Get the updated work order with details
    const updatedWorkOrder = await WorkOrder.findByPk(work_id, {
      include: [
        {
          model: ManufactureOrder,
          attributes: ['order_id', 'order_number', 'product_id', 'status']
        },
        {
          model: ManufactureStep,
          attributes: ['step_id', 'step_name', 'step_description']
        },
        {
          model: WorkStation,
          attributes: ['station_id', 'code', 'name']
        },
        {
          model: SemiFinishedProduct,
          attributes: ['semi_product_id', 'code', 'name']
        },
        {
          model: User,
          attributes: ['user_id', 'username'],
          as: 'AssignedUser'
        }
      ]
    });
    
    return res.status(200).json(updatedWorkOrder);
  } catch (error) {
    await t.rollback();
    console.error('Error updating work order:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// Complete work order and transfer products
exports.completeWorkOrder = async (req, res) => {
  const t = await sequelize.transaction();
  
  try {
    const { work_id } = req.params;
    const { completed_quantity } = req.body;
    
    const workOrder = await WorkOrder.findByPk(work_id, {
      include: [
        {
          model: ManufactureOrder,
          include: [{ model: BOM }]
        }
      ]
    });
    
    if (!workOrder) {
      await t.rollback();
      return res.status(404).json({ message: 'Work order not found' });
    }
    
    // Deduct materials from BOM
    await bomController.deductMaterialsFromBom(
      workOrder.ManufactureOrder.BOM.bom_id,
      completed_quantity,
      t
    );
    
    // Update work order status
    workOrder.completed_quantity = completed_quantity;
    workOrder.status = 'completed';
    workOrder.end_time = new Date();
    await workOrder.save({ transaction: t });
    
    // Add completed products to warehouse 2000
    const inventory = await Inventory.findOne({
      where: {
        item_id: workOrder.semi_product_id || workOrder.ManufactureOrder.product_id,
        item_type: workOrder.semi_product_id ? 'semi_product' : 'product',
        warehouse_id: 2000
      }
    });
    
    if (inventory) {
      inventory.quantity += completed_quantity;
      await inventory.save({ transaction: t });
    } else {
      await Inventory.create({
        item_id: workOrder.semi_product_id || workOrder.ManufactureOrder.product_id,
        item_type: workOrder.semi_product_id ? 'semi_product' : 'product',
        warehouse_id: 2000,
        quantity: completed_quantity,
        last_updated: new Date()
      }, { transaction: t });
    }
    
    // Create inventory transaction for warehouse 2000
    await InventoryTransaction.create({
      transaction_type: 'import',
      item_id: workOrder.semi_product_id || workOrder.ManufactureOrder.product_id,
      item_type: workOrder.semi_product_id ? 'semi_product' : 'product',
      to_warehouse_id: 2000,
      quantity: completed_quantity,
      reference_id: work_id,
      reference_type: 'work_order',
      transaction_date: new Date()
    }, { transaction: t });
    
    // Transfer to warehouse 3000
    await InventoryTransaction.create({
      transaction_type: 'transfer',
      item_id: workOrder.semi_product_id || workOrder.ManufactureOrder.product_id,
      item_type: workOrder.semi_product_id ? 'semi_product' : 'product',
      from_warehouse_id: 2000,
      to_warehouse_id: 3000,
      quantity: completed_quantity,
      reference_id: work_id,
      reference_type: 'work_order',
      transaction_date: new Date()
    }, { transaction: t });
    
    // Update inventory in warehouse 3000
    const inventory3000 = await Inventory.findOne({
      where: {
        item_id: workOrder.semi_product_id || workOrder.ManufactureOrder.product_id,
        item_type: workOrder.semi_product_id ? 'semi_product' : 'product',
        warehouse_id: 3000
      }
    });
    
    if (inventory3000) {
      inventory3000.quantity += completed_quantity;
      await inventory3000.save({ transaction: t });
    } else {
      await Inventory.create({
        item_id: workOrder.semi_product_id || workOrder.ManufactureOrder.product_id,
        item_type: workOrder.semi_product_id ? 'semi_product' : 'product',
        warehouse_id: 3000,
        quantity: completed_quantity,
        last_updated: new Date()
      }, { transaction: t });
    }
    
    await t.commit();
    return res.status(200).json({ message: 'Work order completed successfully' });
  } catch (error) {
    await t.rollback();
    console.error('Error completing work order:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}; 