const { Warehouse } = require('../models');
const { Op } = require('sequelize');

// Get all warehouses with pagination and filters
exports.getAllWarehouses = async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const offset = (page - 1) * limit;
    
    // Build filter condition
    const where = {};
    if (status) where.status = status;
    
    // Find warehouses with pagination
    const { count, rows } = await Warehouse.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset: parseInt(offset),
      attributes: ['warehouse_id', 'code', 'name', 'capacity', 'capacity_unit', 'status'],
      order: [['warehouse_id', 'DESC']]
    });
    
    return res.status(200).json({
      warehouses: rows,
      total: count,
      page: parseInt(page),
      limit: parseInt(limit)
    });
  } catch (error) {
    console.error('Error getting warehouses:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// Get warehouse by ID
exports.getWarehouseById = async (req, res) => {
  try {
    const { warehouse_id } = req.params;
    const warehouse = await Warehouse.findByPk(warehouse_id);
    
    if (!warehouse) {
      return res.status(404).json({ message: 'Warehouse not found' });
    }
    
    return res.status(200).json(warehouse);
  } catch (error) {
    console.error('Error getting warehouse:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// Create new warehouse
exports.createWarehouse = async (req, res) => {
  try {
    const { code, name, capacity, capacity_unit, status } = req.body;
    
    // Check if code already exists
    const existingWarehouse = await Warehouse.findOne({ where: { code } });
    if (existingWarehouse) {
      return res.status(400).json({ message: 'Warehouse code already exists' });
    }
    
    // Create new warehouse
    const newWarehouse = await Warehouse.create({
      code,
      name,
      capacity,
      capacity_unit,
      status
    });
    
    return res.status(201).json(newWarehouse);
  } catch (error) {
    console.error('Error creating warehouse:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// Update warehouse
exports.updateWarehouse = async (req, res) => {
  try {
    const { warehouse_id } = req.params;
    const { code, name, capacity, capacity_unit, status } = req.body;
    
    // Find warehouse by ID
    const warehouse = await Warehouse.findByPk(warehouse_id);
    if (!warehouse) {
      return res.status(404).json({ message: 'Warehouse not found' });
    }
    
    // Check if updating code and if it already exists
    if (code && code !== warehouse.code) {
      const existingWarehouse = await Warehouse.findOne({ where: { code } });
      if (existingWarehouse) {
        return res.status(400).json({ message: 'Warehouse code already exists' });
      }
    }
    
    // Update warehouse fields
    await warehouse.update({
      code: code || warehouse.code,
      name: name || warehouse.name,
      capacity: capacity !== undefined ? capacity : warehouse.capacity,
      capacity_unit: capacity_unit || warehouse.capacity_unit,
      status: status || warehouse.status
    });
    
    return res.status(200).json(warehouse);
  } catch (error) {
    console.error('Error updating warehouse:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// Delete warehouse
exports.deleteWarehouse = async (req, res) => {
  try {
    const { warehouse_id } = req.params;
    
    // Find warehouse by ID
    const warehouse = await Warehouse.findByPk(warehouse_id);
    if (!warehouse) {
      return res.status(404).json({ message: 'Warehouse not found' });
    }
    
    // Delete warehouse (soft delete by changing status)
    warehouse.status = 'inactive';
    await warehouse.save();
    
    return res.status(200).json({ message: 'Warehouse deleted' });
  } catch (error) {
    console.error('Error deleting warehouse:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};