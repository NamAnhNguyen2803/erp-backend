const Material = require('../models/Material'); // Đảm bảo đường dẫn đúng đến Material model
const { Op } = require('sequelize');

// Get all materials with pagination and filters
exports.getAllMaterials = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, search } = req.query;
    const offset = (page - 1) * limit;

    // Build filter condition
    const where = {};
    if (status) where.status = status;

    if (search) {
      where[Op.or] = [
        { code: { [Op.like]: `%${search}%` } },
        { name: { [Op.like]: `%${search}%` } },
        { supplier: { [Op.like]: `%${search}%` } }
      ];
    }

    // Find materials with pagination
    const { count, rows } = await Material.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset: parseInt(offset),
      attributes: ['material_id', 'code', 'name', 'unit',  'unit_price', 'status', 'supplier'],
      order: [['material_id', 'DESC']]
    });

    return res.status(200).json({
      materials: rows,
      total: count,
      page: parseInt(page),
      limit: parseInt(limit)
    });
  } catch (error) {
    console.error('Error getting materials:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// Get material by ID
exports.getMaterialById = async (req, res) => {
  try {
    const { material_id } = req.params;
    const material = await Material.findByPk(material_id);

    if (!material) {
      return res.status(404).json({ message: 'Material not found' });
    }

    return res.status(200).json(material);
  } catch (error) {
    console.error('Error getting material:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// Create new material
exports.createMaterial = async (req, res) => {
  try {
    const { code, name, unit, specification, min_stock, max_stock, unit_price, supplier, status } = req.body;

    // Check if code already exists
    const existingMaterial = await Material.findOne({ where: { code } });
    if (existingMaterial) {
      return res.status(400).json({ message: 'Material code already exists' });
    }

    // Create new material
    const newMaterial = await Material.create({
      code,
      name,
      unit,
      specification,
      min_stock,
      max_stock,// Initialize with 0 stock
      unit_price,
      supplier,
      status
    });

    return res.status(201).json(newMaterial);
  } catch (error) {
    console.error('Error creating material:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// Update material
exports.updateMaterial = async (req, res) => {
  try {
    const { material_id } = req.params;
    const { code, name, unit, specification, min_stock, max_stock,  unit_price, supplier, status } = req.body;

    // Find material by ID
    const material = await Material.findByPk(material_id);
    if (!material) {
      return res.status(404).json({ message: 'Material not found' });
    }

    // Check if updating code and if it already exists
    if (code && code !== material.code) {
      const existingMaterial = await Material.findOne({ where: { code } });
      if (existingMaterial) {
        return res.status(400).json({ message: 'Material code already exists' });
      }
    }

    // Update material fields
    await material.update({
      code: code || material.code,
      name: name || material.name,
      unit: unit || material.unit,
      specification: specification !== undefined ? specification : material.specification,
      min_stock: min_stock !== undefined ? min_stock : material.min_stock,
      max_stock: max_stock !== undefined ? max_stock : material.max_stock,
      unit_price: unit_price !== undefined ? unit_price : material.unit_price,
      supplier: supplier !== undefined ? supplier : material.supplier,
      status: status || material.status
    });

    return res.status(200).json(material);
  } catch (error) {
    console.error('Error updating material:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// Delete material (soft delete by changing status to 'inactive')
exports.deleteMaterial = async (req, res) => {
  try {
    const { material_id } = req.params;

    // Find material by ID
    const material = await Material.findByPk(material_id);
    if (!material) {
      return res.status(404).json({ message: 'Material not found' });
    }

    // Soft delete by changing status to 'inactive'
    material.status = 'inactive';
    await material.save();

    return res.status(200).json({ message: 'Material status set to inactive' });
  } catch (error) {
    console.error('Error deleting material:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};