const { BOM, BOMItem, Product, User, Material, SemiFinishedProduct, Inventory, InventoryTransaction } = require('../models');
const { Op } = require('sequelize');
const sequelize = require('../config/database');

// Get all BOMs with pagination and filters
exports.getAllBoms = async (req, res) => {
  try {
    const { page = 1, limit = 10, product_id, status } = req.query;
    const offset = (page - 1) * limit;
    
    // Build filter condition
    const where = {};
    if (product_id) where.product_id = product_id;
    if (status === 'active') where.is_active = true;
    else if (status === 'inactive') where.is_active = false;
    
    // Find BOMs with pagination
    const { count, rows } = await BOM.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset: parseInt(offset),
      include: [
        {
          model: Product,
          attributes: ['product_id', 'code', 'name']
        },
        {
          model: User,
          attributes: ['user_id', 'username']
        }
      ],
      order: [['bom_id', 'DESC']]
    });
    
    return res.status(200).json({
      boms: rows,
      total: count,
      page: parseInt(page),
      limit: parseInt(limit)
    });
  } catch (error) {
    console.error('Error getting BOMs:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// Get BOM by ID with items
exports.getBomById = async (req, res) => {
  try {
    const { bom_id } = req.params;
    const bom = await BOM.findByPk(bom_id, {
      include: [
        {
          model: Product,
          attributes: ['product_id', 'code', 'name', 'unit']
        },
        {
          model: User,
          attributes: ['user_id', 'username']
        }
      ]
    });
    
    if (!bom) {
      return res.status(404).json({ message: 'BOM not found' });
    }
    
    // Get BOM items
    const bomItems = await BOMItem.findAll({
      where: { bom_id },
      order: [['item_id', 'ASC']]
    });
    
    // Get details for each item based on item_type
    const bomItemsWithDetails = await Promise.all(
      bomItems.map(async (item) => {
        const bomItem = item.toJSON();
        
        try {
          if (bomItem.item_type === 'material') {
            const material = await Material.findByPk(bomItem.material_id);
            if (material) {
              bomItem.material_details = {
                code: material.code,
                name: material.name,
                unit: material.unit
              };
            }
          } else if (bomItem.item_type === 'semi_product') {
            const semiProduct = await SemiFinishedProduct.findByPk(bomItem.material_id);
            if (semiProduct) {
              bomItem.material_details = {
                code: semiProduct.code,
                name: semiProduct.name,
                unit: semiProduct.unit
              };
            }
          } else if (bomItem.item_type === 'product') {
            const product = await Product.findByPk(bomItem.material_id);
            if (product) {
              bomItem.material_details = {
                code: product.code,
                name: product.name,
                unit: product.unit
              };
            }
          }
        } catch (error) {
          console.error(`Error fetching details for material: ${bomItem.material_id}`, error);
        }
        
        return bomItem;
      })
    );
    
    // Combine BOM with its items
    const result = bom.toJSON();
    result.items = bomItemsWithDetails;
    
    return res.status(200).json(result);
  } catch (error) {
    console.error('Error getting BOM:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// Create new BOM with items
exports.createBom = async (req, res) => {
  // Transaction to ensure data consistency
  const t = await sequelize.transaction();
  
  try {
    const { product_id, version, description, is_active, created_by, notes, items } = req.body;
    
    // Validate product_id
    const product = await Product.findByPk(product_id);
    if (!product) {
      await t.rollback();
      return res.status(400).json({ message: 'Invalid product_id' });
    }
    
    // Validate user_id (created_by)
    const user = await User.findByPk(created_by);
    if (!user) {
      await t.rollback();
      return res.status(400).json({ message: 'Invalid created_by user_id' });
    }
    
    // Check if BOM version already exists for this product
    const existingBom = await BOM.findOne({
      where: {
        product_id,
        version
      }
    });
    
    if (existingBom) {
      await t.rollback();
      return res.status(400).json({ message: 'BOM version already exists for this product' });
    }
    
    // Create new BOM
    const newBom = await BOM.create({
      product_id,
      version,
      is_active: is_active !== undefined ? is_active : true,
      created_by,
      notes
    }, { transaction: t });
    
    // Create BOM items if provided
    if (items && Array.isArray(items) && items.length > 0) {
      // Validate and create each item
      const bomItems = items.map(item => ({
        bom_id: newBom.bom_id,
        material_id: item.material_id,
        item_type: item.item_type,
        bom_level: item.bom_level || 1,
        reference: item.reference,
        quantity: item.quantity,
        waste_percent: item.waste_percent || 0,
        notes: item.notes
      }));
      
      await BOMItem.bulkCreate(bomItems, { transaction: t });
    }
    
    await t.commit();
    
    // Get the created BOM with items
    const createdBom = await this.getBomById({ params: { bom_id: newBom.bom_id } }, { 
      status: (code) => ({ 
        json: (data) => data 
      }) 
    });
    
    return res.status(201).json(createdBom);
  } catch (error) {
    await t.rollback();
    console.error('Error creating BOM:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// Update BOM
exports.updateBom = async (req, res) => {
  // Transaction to ensure data consistency
  const t = await sequelize.transaction();
  
  try {
    const { bom_id } = req.params;
    const { version, description, is_active, notes, items } = req.body;
    
    // Find BOM by ID
    const bom = await BOM.findByPk(bom_id);
    if (!bom) {
      await t.rollback();
      return res.status(404).json({ message: 'BOM not found' });
    }
    
    // Check if version already exists for this product (if changing version)
    if (version && version !== bom.version) {
      const existingBom = await BOM.findOne({
        where: {
          product_id: bom.product_id,
          version,
          bom_id: { [Op.ne]: bom_id }
        }
      });
      
      if (existingBom) {
        await t.rollback();
        return res.status(400).json({ message: 'BOM version already exists for this product' });
      }
    }
    
    // Update BOM fields
    await bom.update({
      version: version || bom.version,
      is_active: is_active !== undefined ? is_active : bom.is_active,
      notes: notes !== undefined ? notes : bom.notes
    }, { transaction: t });
    
    // Update items if provided
    if (items && Array.isArray(items)) {
      // First, delete existing items
      await BOMItem.destroy({
        where: { bom_id },
        transaction: t
      });
      
      // Then create new items
      if (items.length > 0) {
        const bomItems = items.map(item => ({
          bom_id,
          material_id: item.material_id,
          item_type: item.item_type,
          bom_level: item.bom_level || 1,
          reference: item.reference,
          quantity: item.quantity,
          waste_percent: item.waste_percent || 0,
          notes: item.notes
        }));
        
        await BOMItem.bulkCreate(bomItems, { transaction: t });
      }
    }
    
    await t.commit();
    
    // Get the updated BOM with items
    const updatedBom = await this.getBomById({ params: { bom_id } }, { 
      status: (code) => ({ 
        json: (data) => data 
      }) 
    });
    
    return res.status(200).json(updatedBom);
  } catch (error) {
    await t.rollback();
    console.error('Error updating BOM:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// Deduct materials based on BOM when manufacturing
exports.deductMaterialsFromBom = async (bom_id, quantity, t) => {
  try {
    const bom = await BOM.findByPk(bom_id, {
      include: [{
        model: BOMItem,
        where: { is_active: true }
      }]
    });

    if (!bom) {
      throw new Error('BOM not found');
    }

    // Deduct each material in BOM
    for (const item of bom.BOMItems) {
      const deductQuantity = item.quantity * quantity;
      
      // Update inventory based on item type
      const inventory = await Inventory.findOne({
        where: {
          item_id: item.material_id,
          item_type: item.item_type,
          warehouse_id: 2000 // Kho sản xuất
        }
      });

      if (!inventory || inventory.quantity < deductQuantity) {
        throw new Error(`Insufficient quantity for item ${item.material_id}`);
      }

      // Deduct quantity
      inventory.quantity -= deductQuantity;
      await inventory.save({ transaction: t });

      // Create inventory transaction record
      await InventoryTransaction.create({
        transaction_type: 'export',
        item_id: item.material_id,
        item_type: item.item_type,
        from_warehouse_id: 2000,
        quantity: deductQuantity,
        reference_id: bom.bom_id,
        reference_type: 'bom',
        transaction_date: new Date()
      }, { transaction: t });
    }

    return true;
  } catch (error) {
    throw error;
  }
}; 