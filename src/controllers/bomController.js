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
        },
        {
          model: BOMItem,
          include: [
            {
              model: Material,
              attributes: ['material_id', 'code', 'name']
            }
          ]
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
exports.getBomDetails = async (req, res) => {
  try {
    const bomId = req.params.id;
    const workQuantity = req.query.work_quantity || 1; // có thể truyền từ FE, mặc định 1

    // Lấy BOM kèm Product
    const bom = await BOM.findByPk(bomId, {
      include: [
        { model: Product },
        { model: BOMItem }
      ]
    });

    if (!bom) {
      return res.status(404).json({ message: 'BOM not found' });
    }

    // Fetch chi tiết cho các BOM item
    const bomItemsWithDetails = await Promise.all(
      bom.BOMItems.map(async (item) => {
        const plainItem = item.toJSON();

        let materialDetails = null;

        if (plainItem.item_type === 'material') {
          materialDetails = await Material.findByPk(plainItem.material_id);
        } else if (plainItem.item_type === 'semi_product') {
          materialDetails = await SemiFinishedProduct.findByPk(plainItem.material_id);
        } else if (plainItem.item_type === 'product') {
          materialDetails = await Product.findByPk(plainItem.material_id);
        }

        return {
          ...plainItem,
          material_details: materialDetails
            ? {
              code: materialDetails.code,
              name: materialDetails.name,
              unit: materialDetails.unit
            }
            : null,
          required_quantity: plainItem.quantity * workQuantity,
        };
      })
    );

    // Gộp dữ liệu trả về
    return res.status(200).json({
      product: {
        id: bom.Product.id,
        code: bom.Product.code,
        name: bom.Product.name,
        unit: bom.Product.unit
      },
      bom_version: bom.version,
      items: bomItemsWithDetails
    });
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
    const { product_id, version, description, created_by, notes, items } = req.body;

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
    const { version, description, notes, items } = req.body;

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
        where: {}
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

// Delete BOM by ID
exports.deleteBom = async (req, res) => {
  const t = await sequelize.transaction();

  try {
    const { bom_id } = req.params;

    // Kiểm tra tồn tại BOM
    const bom = await BOM.findByPk(bom_id);
    if (!bom) {
      await t.rollback();
      return res.status(404).json({ message: 'BOM not found' });
    }

    // Xóa các BOM items trước
    await BOMItem.destroy({ where: { bom_id }, transaction: t });

    // Xóa BOM
    await BOM.destroy({ where: { bom_id }, transaction: t });

    await t.commit();
    return res.status(200).json({ message: 'BOM deleted successfully' });
  } catch (error) {
    await t.rollback();
    console.error('Error deleting BOM:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};
