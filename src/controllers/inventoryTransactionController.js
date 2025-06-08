const {
  InventoryTransaction,
  Warehouse,
  Material,
  Product,
  SemiFinishedProduct,
  ProductInventory,
  MaterialInventory,
  SemiProductInventory,
  User
} = require('../models');
const { Op } = require('sequelize');
const sequelize = require('../config/database');
const inventoryHelper = require('../helper/inventoryHelper');
const { findItemByType } = require('../helper/inventoryHelper');
// Helper function to get inventory model based on item type
const getInventoryModel = (itemType) => {
  switch (itemType) {
    case 'material': return MaterialInventory;
    case 'product': return ProductInventory;
    case 'semi_product': return SemiProductInventory;
    default: throw new Error('Invalid item type');
  }
};

// Helper function to get item field name based on type
const getItemFieldName = (itemType) => {
  switch (itemType) {
    case 'material': return 'material_id';
    case 'product': return 'product_id';
    case 'semi_product': return 'semi_product_id';
    default: throw new Error('Invalid item type');
  }
};

// Import goods to warehouse
exports.importGoods = async (req, res) => {
  const t = await sequelize.transaction();

  try {
    const {
      item_id,
      item_type,
      to_warehouse_id,
      quantity,
      reference_id,
      reference_type,
      description
    } = req.body;

    if (!item_id || !item_type || !to_warehouse_id || !quantity) {
      await t.rollback();
      return res.status(400).json({
        message: 'item_id, item_type, to_warehouse_id và quantity là bắt buộc'
      });
    }

    // Validate item exist
    let item;
    if (item_type === 'material') {
      item = await Material.findByPk(item_id);
    } else if (item_type === 'product') {
      item = await Product.findByPk(item_id);
    } else if (item_type === 'semi_product') {
      item = await SemiFinishedProduct.findByPk(item_id);
    }

    if (!item) {
      await t.rollback();
      return res.status(400).json({ message: 'Không tìm thấy item' });
    }

    // Validate warehouse
    const warehouse = await Warehouse.findByPk(to_warehouse_id);
    if (!warehouse) {
      await t.rollback();
      return res.status(400).json({ message: 'Không tìm thấy kho' });
    }

    // Create import transaction
    const transaction = await InventoryTransaction.create({
      from_warehouse_id: null,
      to_warehouse_id,
      item_id,
      item_type,
      quantity,
      unit: item.unit,
      transaction_date: new Date(),
      transaction_type: 'import',
      reference_id,
      reference_type,
      description,
      created_by: req.user ? req.user.user_id : 1
    }, { transaction: t });

    // Update inventory
    const InventoryModel = getInventoryModel(item_type);
    const itemField = getItemFieldName(item_type);

    const [inventory] = await InventoryModel.findOrCreate({
      where: {
        warehouse_id: to_warehouse_id,
        [itemField]: item_id
      },
      defaults: {
        quantity: 0,
        unit: item.unit
      },
      transaction: t
    });

    await inventory.increment('quantity', {
      by: quantity,
      transaction: t
    });

    await t.commit();

    return res.status(201).json({
      message: 'Nhập kho thành công',
      transaction_id: transaction.transaction_id
    });
  } catch (error) {
    await t.rollback();
    console.error('Error importing goods:', error);
    return res.status(500).json({ message: 'Lỗi server' });
  }
};

// Export goods from warehouse
exports.exportGoods = async (req, res) => {
  const t = await sequelize.transaction();

  try {
    const {
      item_id,
      item_type,
      from_warehouse_id,
      quantity,
      reference_id,
      reference_type,
      description
    } = req.body;

    if (!item_id || !item_type || !from_warehouse_id || !quantity) {
      await t.rollback();
      return res.status(400).json({
        message: 'item_id, item_type, from_warehouse_id và quantity là bắt buộc'
      });
    }

    // Check inventory availability
    const InventoryModel = getInventoryModel(item_type);
    const itemField = getItemFieldName(item_type);

    const inventory = await InventoryModel.findOne({
      where: {
        [itemField]: item_id,
        warehouse_id: from_warehouse_id
      }
    });

    if (!inventory || inventory.quantity < quantity) {
      await t.rollback();
      return res.status(400).json({
        message: 'Không đủ hàng trong kho',
        available: inventory ? inventory.quantity : 0,
        requested: quantity
      });
    }

    // Get item for unit info
    let item;
    if (item_type === 'material') {
      item = await Material.findByPk(item_id);
    } else if (item_type === 'product') {
      item = await Product.findByPk(item_id);
    } else if (item_type === 'semi_product') {
      item = await SemiFinishedProduct.findByPk(item_id);
    }

    // Create export transaction
    const transaction = await InventoryTransaction.create({
      from_warehouse_id,
      to_warehouse_id: null,
      item_id,
      item_type,
      quantity,
      unit: item.unit,
      transaction_date: new Date(),
      transaction_type: 'export',
      reference_id,
      reference_type,
      description,
      created_by: req.user ? req.user.user_id : null
    }, { transaction: t });

    // Update inventory
    await inventory.decrement('quantity', {
      by: quantity,
      transaction: t
    });

    await t.commit();

    return res.status(201).json({
      message: 'Xuất kho thành công',
      transaction_id: transaction.transaction_id
    });
  } catch (error) {
    await t.rollback();
    console.error('Error exporting goods:', error);
    return res.status(500).json({ message: 'Lỗi server' });
  }
};

// Transfer goods between warehouses
exports.transferGoods = async (req, res) => {
  const t = await sequelize.transaction();

  try {
    const {
      item_id,
      item_type,
      from_warehouse_id,
      to_warehouse_id,
      quantity,
      reference_id,
      reference_type,
      description
    } = req.body;

    if (!item_id || !item_type || !from_warehouse_id || !to_warehouse_id || !quantity) {
      await t.rollback();
      return res.status(400).json({
        message: 'Tất cả các trường là bắt buộc'
      });
    }

    if (from_warehouse_id === to_warehouse_id) {
      await t.rollback();
      return res.status(400).json({ message: 'Kho nguồn và kho đích không được giống nhau' });
    }

    const InventoryModel = getInventoryModel(item_type);
    const itemField = getItemFieldName(item_type);

    // Check inventory availability
    const fromInventory = await InventoryModel.findOne({
      where: {
        [itemField]: item_id,
        warehouse_id: from_warehouse_id
      }
    });

    if (!fromInventory || fromInventory.quantity < quantity) {
      await t.rollback();
      return res.status(400).json({
        message: 'Không đủ hàng trong kho nguồn',
        available: fromInventory ? fromInventory.quantity : 0,
        requested: quantity
      });
    }

    // Get item for unit info
    let item;
    if (item_type === 'material') {
      item = await Material.findByPk(item_id);
    } else if (item_type === 'product') {
      item = await Product.findByPk(item_id);
    } else if (item_type === 'semi_product') {
      item = await SemiFinishedProduct.findByPk(item_id);
    }

    // Create transfer transaction
    const transaction = await InventoryTransaction.create({
      from_warehouse_id,
      to_warehouse_id,
      item_id,
      item_type,
      quantity,
      unit: item.unit,
      transaction_date: new Date(),
      transaction_type: 'transfer',
      reference_id,
      reference_type,
      description,
      created_by: req.user ? req.user.user_id : 1
    }, { transaction: t });

    // Update source inventory
    await fromInventory.decrement('quantity', {
      by: quantity,
      transaction: t
    });

    // Update destination inventory
    const [toInventory] = await InventoryModel.findOrCreate({
      where: {
        warehouse_id: to_warehouse_id,
        [itemField]: item_id
      },
      defaults: {
        quantity: 0,
        unit: item.unit
      },
      transaction: t
    });

    await toInventory.increment('quantity', {
      by: quantity,
      transaction: t
    });

    await t.commit();

    return res.status(201).json({
      message: 'Chuyển kho thành công',
      transaction_id: transaction.transaction_id
    });
  } catch (error) {
    await t.rollback();
    console.error('Error transferring goods:', error);
    return res.status(500).json({ message: 'Lỗi server' });
  }
};


// GET /api/inventory-transactions
exports.getAllInventoryTransactions = async (req, res) => {
  try {
    const { page = 1, limit = 10, transaction_type, item_type, warehouse_id } = req.query;
    const offset = (page - 1) * limit;
    const where = {};

    if (transaction_type) where.transaction_type = transaction_type;
    if (item_type) where.item_type = item_type;
    if (warehouse_id) {
      where[Op.or] = [
        { from_warehouse_id: warehouse_id },
        { to_warehouse_id: warehouse_id }
      ];
    }

    const { count, rows } = await InventoryTransaction.findAndCountAll({
      where,
      limit: +limit,
      offset,
      order: [['transaction_id', 'DESC']],
      include: [
        { model: Warehouse, as: 'FromWarehouse', attributes: ['warehouse_id', 'code', 'name'] },
        { model: Warehouse, as: 'ToWarehouse', attributes: ['warehouse_id', 'code', 'name'] },
        { model: User, as: 'CreatedByUser', attributes: ['user_id', 'username'] },
      ]
    });

    // Dùng helper để map item_name cho từng transaction
    const transactionsWithNames = await inventoryHelper.attachItemNames(rows);

    return res.status(200).json({
      transactions: transactionsWithNames,
      total: count,
      page: +page,
      limit: +limit
    });
  } catch (error) {
    console.error('Error getting inventory transactions:', error);
    return res.status(500).json({ message: 'Lỗi server' });
  }
};

// Get transaction by ID
exports.getTransactionById = async (req, res) => {
  try {
    const { id } = req.params;

    const transaction = await InventoryTransaction.findByPk(id, {
      include: [
        {
          model: Warehouse,
          as: 'FromWarehouse',
          attributes: ['warehouse_id', 'code', 'name']
        },
        {
          model: Warehouse,
          as: 'ToWarehouse',
          attributes: ['warehouse_id', 'code', 'name']
        },
        {
          model: User,
          as: 'CreatedByUser',
          attributes: ['user_id', 'username']
        }
      ]
    });

    if (!transaction) {
      return res.status(404).json({ message: 'Không tìm thấy giao dịch' });
    }

    // Get item details
    const transactionObj = transaction.toJSON();

    if (transaction.item_type === 'material') {
      const material = await Material.findByPk(transaction.item_id);
      if (material) {
        transactionObj.item_details = {
          code: material.code,
          name: material.name,
          unit: material.unit
        };
      }
    } else if (transaction.item_type === 'product') {
      const product = await Product.findByPk(transaction.item_id);
      if (product) {
        transactionObj.item_details = {
          code: product.code,
          name: product.name,
          unit: product.unit
        };
      }
    } else if (transaction.item_type === 'semi_product') {
      const semiProduct = await SemiFinishedProduct.findByPk(transaction.item_id);
      if (semiProduct) {
        transactionObj.item_details = {
          code: semiProduct.code,
          name: semiProduct.name,
          unit: semiProduct.unit
        };
      }
    }

    return res.status(200).json(transactionObj);
  } catch (error) {
    console.error('Error getting transaction:', error);
    return res.status(500).json({ message: 'Lỗi server' });
  }
};

exports.getInventorySummary = async (req, res) => {
  try {
    const { warehouse_id, item_type, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    const inventoryTypes = [
      {
        key: 'material',
        model: MaterialInventory,
        itemKey: 'material',
        includeModels: [
          { model: Warehouse, attributes: ['warehouse_id', 'code', 'name'] },
          { model: Material, attributes: ['material_id', 'code', 'name', 'unit'] }
        ]
      },
      {
        key: 'product',
        model: ProductInventory,
        itemKey: 'product',
        includeModels: [
          { model: Warehouse, as: 'warehouse', attributes: ['warehouse_id', 'code', 'name'] },
          { model: Product, as: 'product', attributes: ['product_id', 'code', 'name', 'unit'] }
        ]
      },
      {
        key: 'semi_product',
        model: SemiProductInventory,
        itemKey: 'semi_product',
        includeModels: [
          { model: Warehouse, attributes: ['warehouse_id', 'code', 'name'] },
          { model: SemiFinishedProduct, attributes: ['semi_product_id', 'code', 'name', 'unit'] }
        ]
      }
    ];

    const result = [];
    let totalCount = 0;

    for (const type of inventoryTypes) {
      if (!item_type || item_type === type.key) {
        const where = {};
        if (warehouse_id) where.warehouse_id = warehouse_id;

        const { count, rows } = await type.model.findAndCountAll({
          where,
          include: type.includeModels,
          limit: parseInt(limit),
          offset: parseInt(offset),
          order: [['id', 'DESC']] // Assuming 'id' as the default sorting field; adjust if needed
        });

        result.push(
          ...rows.map(inv => ({
            ...inv.toJSON(),
            item_type: type.key
          }))
        );

        totalCount += count;
      }
    }

    return res.status(200).json({
      inventory: result,
      total: totalCount,
      page: parseInt(page),
      limit: parseInt(limit)
    });
  } catch (error) {
    console.error('🔥 Error getting inventory summary:', error);
    return res.status(500).json({ message: 'Lỗi server' });
  }
};

exports.importGoodsLogic = async (data, t) => {
  const {
    item_id,
    item_type,
    to_warehouse_id,
    quantity,
    reference_id,
    reference_type,
    description,
    user_id
  } = data;

  if (!item_id || !item_type || !to_warehouse_id || !quantity) {
    throw new Error('Thiếu thông tin nhập kho');
  }

  // Tương tự validate và xử lý như importGoods, dùng transaction t truyền vào
  // Không commit/rollback ở đây
  // Nếu lỗi, throw thẳng ra để bắt ở complete()
  // ...

  // Ví dụ đơn giản
  const item = await findItemByType(item_type, item_id, t);
  if (!item) throw new Error('Không tìm thấy item');

  const warehouse = await Warehouse.findByPk(to_warehouse_id, { transaction: t });
  if (!warehouse) throw new Error('Không tìm thấy kho');

  await InventoryTransaction.create({
    from_warehouse_id: null,
    to_warehouse_id,
    item_id,
    item_type,
    quantity,
    unit: item.unit,
    transaction_date: new Date(),
    transaction_type: 'import',
    reference_id,
    reference_type,
    description,
    created_by: user_id || 1
  }, { transaction: t });

  const InventoryModel = getInventoryModel(item_type);
  const itemField = getItemFieldName(item_type);

  const [inventory] = await InventoryModel.findOrCreate({
    where: { warehouse_id: to_warehouse_id, [itemField]: item_id },
    defaults: { quantity: 0, unit: item.unit },
    transaction: t
  });

  await inventory.increment('quantity', { by: quantity, transaction: t });

  return true;
};

exports.exportGoodsLogic = async (data, t) => {
  const {
    item_id,
    item_type,
    from_warehouse_id,
    quantity,
    reference_id,
    reference_type,
    description,
    user_id
  } = data;

  if (!item_id || !item_type || !from_warehouse_id || !quantity) {
    throw new Error('Thiếu thông tin xuất kho');
  }

  const InventoryModel = getInventoryModel(item_type);
  const itemField = getItemFieldName(item_type);

  const inventory = await InventoryModel.findOne({
    where: { warehouse_id: from_warehouse_id, [itemField]: item_id },
    transaction: t
  });

  if (!inventory || inventory.quantity < quantity) {
    throw new Error(`Không đủ hàng trong kho (còn ${inventory ? inventory.quantity : 0})`);
  }

  const item = await findItemByType(item_type, item_id, t);
  if (!item) throw new Error('Không tìm thấy item');

  await InventoryTransaction.create({
    from_warehouse_id,
    to_warehouse_id: null,
    item_id,
    item_type,
    quantity,
    unit: item.unit,
    transaction_date: new Date(),
    transaction_type: 'export',
    reference_id,
    reference_type,
    description,
    created_by: user_id || null
  }, { transaction: t });

  await inventory.decrement('quantity', { by: quantity, transaction: t });

  return true;
};
