const { BOM, BOMItem, Product, User, Material, SemiFinishedProduct, Inventory, InventoryTransaction, ManufacturingOrder } = require('../models');
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
        },
          {
          model: ManufacturingOrder,
          attributes: ['order_id','order_code']
        },
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
  const t = await sequelize.transaction();

  try {
    let { product_id,  version, description, created_by, notes, items } = req.body;
    if (!created_by) created_by = 1;

    const product = await Product.findByPk(product_id);
    if (!product) {
      await t.rollback();
      return res.status(400).json({ message: 'Invalid product_id' });
    }

    const user = await User.findByPk(created_by);
    if (!user) {
      await t.rollback();
      return res.status(400).json({ message: 'Invalid created_by user_id' });
    }

    const existingBom = await BOM.findOne({ where: { product_id, version } });
    if (existingBom) {
      await t.rollback();
      return res.status(400).json({ message: 'BOM version already exists for this product' });
    }
    const newBom = await BOM.create({ product_id, version, created_by, notes }, { transaction: t });

    if (items && Array.isArray(items) && items.length > 0) {
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
    return res.status(201).json({ message: 'BOM created successfully' });

  } catch (error) {
    await t.rollback();
    console.error('❌ Error creating BOM:', error.message, error.stack);
    return res.status(500).json({ message: error.message || 'Internal server error' });
  }
};


// Update BOM
exports.updateBom = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { bom_id, items, order_id, notes } = req.body;
    console.log(bom_id)
    // Xóa các BOMItem cũ
    await BOMItem.destroy({ where: { bom_id }, transaction: t });

    // Tạo lại BOMItems
    if (items && items.length > 0) {
      for (const item of items) {
        await BOMItem.create({ ...item, bom_id }, { transaction: t });
      }
    }

    // Cập nhật ghi chú BOM
    await BOM.update({ bom_id, items, order_id, notes  }, { where: { bom_id }, transaction: t });

    await t.commit();
    res.status(200).json({ message: 'BOM updated successfully' });
  } catch (error) {
    if (!t.finished) await t.rollback(); // 👈 CHỈ rollback nếu transaction chưa kết thúc
    console.error('Error updating BOM:', error);
    res.status(500).json({ message: 'Error updating BOM' });
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
