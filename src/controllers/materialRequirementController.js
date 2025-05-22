const { MaterialRequirement, WorkOrder, Material, ManufactureOrder } = require('../models');
const { Op } = require('sequelize');
const sequelize = require('../config/database');

// Get all material requirements with pagination and filters
exports.getAllMaterialRequirements = async (req, res) => {
  try {
    const { page = 1, limit = 10, work_id } = req.query;
    const offset = (page - 1) * limit;
    
    // Build filter condition
    const where = {};
    if (work_id) where.work_id = work_id;
    
    // Find material requirements with pagination
    const { count, rows } = await MaterialRequirement.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset: parseInt(offset),
      include: [
        {
          model: WorkOrder,
          attributes: ['work_id', 'work_number', 'order_id', 'status'],
          include: [
            {
              model: ManufactureOrder,
              attributes: ['order_id', 'order_number']
            }
          ]
        },
        {
          model: Material,
          attributes: ['material_id', 'code', 'name', 'unit']
        }
      ],
      order: [['requirement_id', 'DESC']]
    });
    
    return res.status(200).json({
      requirements: rows,
      total: count,
      page: parseInt(page),
      limit: parseInt(limit)
    });
  } catch (error) {
    console.error('Error getting material requirements:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// Create new material requirement
exports.createMaterialRequirement = async (req, res) => {
  // Transaction to ensure data consistency
  const t = await sequelize.transaction();
  
  try {
    const { work_id, material_id, required_quantity } = req.body;
    
    // Validate work_id
    const workOrder = await WorkOrder.findByPk(work_id);
    if (!workOrder) {
      await t.rollback();
      return res.status(400).json({ message: 'Invalid work_id' });
    }
    
    // Validate material_id
    const material = await Material.findByPk(material_id);
    if (!material) {
      await t.rollback();
      return res.status(400).json({ message: 'Invalid material_id' });
    }
    
    // Check if requirement already exists for this work_id and material_id
    const existingRequirement = await MaterialRequirement.findOne({
      where: {
        work_id,
        material_id
      }
    });
    
    if (existingRequirement) {
      await t.rollback();
      return res.status(400).json({ message: 'Material requirement already exists for this work order and material' });
    }
    
    // Create new material requirement
    const newRequirement = await MaterialRequirement.create({
      work_id,
      material_id,
      required_quantity,
      issued_quantity: 0
    }, { transaction: t });
    
    await t.commit();
    
    // Get the created requirement with details
    const createdRequirement = await MaterialRequirement.findByPk(newRequirement.requirement_id, {
      include: [
        {
          model: WorkOrder,
          attributes: ['work_id', 'work_number', 'order_id', 'status']
        },
        {
          model: Material,
          attributes: ['material_id', 'code', 'name', 'unit']
        }
      ]
    });
    
    return res.status(201).json(createdRequirement);
  } catch (error) {
    await t.rollback();
    console.error('Error creating material requirement:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// Update material requirement
exports.updateMaterialRequirement = async (req, res) => {
  // Transaction to ensure data consistency
  const t = await sequelize.transaction();
  
  try {
    const { requirement_id } = req.params;
    const { required_quantity, issued_quantity } = req.body;
    
    // Find requirement by ID
    const requirement = await MaterialRequirement.findByPk(requirement_id);
    if (!requirement) {
      await t.rollback();
      return res.status(404).json({ message: 'Material requirement not found' });
    }
    
    // Update requirement fields
    await requirement.update({
      required_quantity: required_quantity !== undefined ? required_quantity : requirement.required_quantity,
      issued_quantity: issued_quantity !== undefined ? issued_quantity : requirement.issued_quantity
    }, { transaction: t });
    
    await t.commit();
    
    // Get the updated requirement with details
    const updatedRequirement = await MaterialRequirement.findByPk(requirement_id, {
      include: [
        {
          model: WorkOrder,
          attributes: ['work_id', 'work_number', 'order_id', 'status']
        },
        {
          model: Material,
          attributes: ['material_id', 'code', 'name', 'unit']
        }
      ]
    });
    
    return res.status(200).json(updatedRequirement);
  } catch (error) {
    await t.rollback();
    console.error('Error updating material requirement:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}; 