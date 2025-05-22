const { InventoryTransaction, Warehouse, Material, Product, SemiFinishedProduct, Inventory, User } = require('../models');
const { Op } = require('sequelize');
const sequelize = require('../config/database');

// Get all inventory transactions with pagination and filters
exports.getAllInventoryTransactions = async (req, res) => {
  try {
    const { page = 1, limit = 10, transaction_type, item_type, warehouse_id } = req.query;
    const offset = (page - 1) * limit;
    
    // Build filter condition
    const where = {};
    if (transaction_type) where.transaction_type = transaction_type;
    if (item_type) where.item_type = item_type;
    if (warehouse_id) {
      where[Op.or] = [
        { from_warehouse_id: warehouse_id },
        { to_warehouse_id: warehouse_id }
      ];
    }
    
    // Find inventory transactions with pagination
    const { count, rows } = await InventoryTransaction.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset: parseInt(offset),
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
      ],
      order: [['transaction_id', 'DESC']]
    });
    
    // Get item details for each transaction
    const transactions = await Promise.all(rows.map(async (transaction) => {
      const transactionObj = transaction.toJSON();
      
      // Get item details based on item_type
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
      } else if (transaction.item_type === 'semi_finished') {
        const semiProduct = await SemiFinishedProduct.findByPk(transaction.item_id);
        if (semiProduct) {
          transactionObj.item_details = {
            code: semiProduct.code,
            name: semiProduct.name,
            unit: semiProduct.unit
          };
        }
      }
      
      return transactionObj;
    }));
    
    return res.status(200).json({
      transactions,
      total: count,
      page: parseInt(page),
      limit: parseInt(limit)
    });
  } catch (error) {
    console.error('Error getting inventory transactions:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// Create new inventory transaction
exports.createInventoryTransaction = async (req, res) => {
  // Transaction to ensure data consistency
  const t = await sequelize.transaction();
  
  try {
    const { 
      transaction_type, 
      item_id, 
      item_type, 
      from_warehouse_id, 
      to_warehouse_id, 
      quantity, 
      reference_id, 
      reference_type 
    } = req.body;
    
    // Validate transaction_type
    const validTransactionTypes = ['import', 'export', 'transfer'];
    if (!validTransactionTypes.includes(transaction_type)) {
      await t.rollback();
      return res.status(400).json({ message: 'Invalid transaction_type. Must be import, export, or transfer' });
    }
    
    // Validate item_type
    const validItemTypes = ['material', 'product', 'semi_finished'];
    if (!validItemTypes.includes(item_type)) {
      await t.rollback();
      return res.status(400).json({ message: 'Invalid item_type. Must be material, product, or semi_finished' });
    }
    
    // Validate item_id based on item_type
    let item;
    if (item_type === 'material') {
      item = await Material.findByPk(item_id);
    } else if (item_type === 'product') {
      item = await Product.findByPk(item_id);
    } else if (item_type === 'semi_finished') {
      item = await SemiFinishedProduct.findByPk(item_id);
    }
    
    if (!item) {
      await t.rollback();
      return res.status(400).json({ message: `Invalid item_id for the specified item_type` });
    }
    
    // Validate warehouses based on transaction_type
    if (transaction_type === 'import' || transaction_type === 'transfer') {
      if (!to_warehouse_id) {
        await t.rollback();
        return res.status(400).json({ message: 'to_warehouse_id is required for import or transfer transactions' });
      }
      
      const toWarehouse = await Warehouse.findByPk(to_warehouse_id);
      if (!toWarehouse) {
        await t.rollback();
        return res.status(400).json({ message: 'Invalid to_warehouse_id' });
      }
    }
    
    if (transaction_type === 'export' || transaction_type === 'transfer') {
      if (!from_warehouse_id) {
        await t.rollback();
        return res.status(400).json({ message: 'from_warehouse_id is required for export or transfer transactions' });
      }
      
      const fromWarehouse = await Warehouse.findByPk(from_warehouse_id);
      if (!fromWarehouse) {
        await t.rollback();
        return res.status(400).json({ message: 'Invalid from_warehouse_id' });
      }
      
      // Check inventory quantity if it's an export or transfer
      const inventory = await Inventory.findOne({
        where: {
          item_id,
          item_type,
          warehouse_id: from_warehouse_id
        }
      });
      
      if (!inventory || inventory.quantity < quantity) {
        await t.rollback();
        return res.status(400).json({ 
          message: 'Insufficient inventory quantity',
          available: inventory ? inventory.quantity : 0,
          requested: quantity
        });
      }
    }
    
    // Create the inventory transaction
    const newTransaction = await InventoryTransaction.create({
      transaction_type,
      item_id,
      item_type,
      from_warehouse_id: transaction_type === 'import' ? null : from_warehouse_id,
      to_warehouse_id: transaction_type === 'export' ? null : to_warehouse_id,
      quantity,
      transaction_date: new Date(),
      reference_id,
      reference_type,
      created_by: req.user ? req.user.user_id : null
    }, { transaction: t });
    
    // Update inventory quantities based on transaction type
    if (transaction_type === 'import' || transaction_type === 'transfer') {
      // Increase inventory in destination warehouse
      const [toInventory] = await Inventory.findOrCreate({
        where: {
          warehouse_id: to_warehouse_id,
          item_id,
          item_type
        },
        defaults: {
          quantity: 0
        },
        transaction: t
      });
      
      await toInventory.increment('quantity', { 
        by: quantity,
        transaction: t 
      });
    }
    
    if (transaction_type === 'export' || transaction_type === 'transfer') {
      // Decrease inventory in source warehouse
      const fromInventory = await Inventory.findOne({
        where: {
          warehouse_id: from_warehouse_id,
          item_id,
          item_type
        },
        transaction: t
      });
      
      await fromInventory.decrement('quantity', { 
        by: quantity,
        transaction: t 
      });
    }
    
    await t.commit();
    
    // Get the created transaction with related details
    const transaction = await InventoryTransaction.findByPk(newTransaction.transaction_id, {
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
    
    // Get item details
    let itemDetails = null;
    if (item_type === 'material') {
      const material = await Material.findByPk(item_id);
      itemDetails = {
        code: material.code,
        name: material.name,
        unit: material.unit
      };
    } else if (item_type === 'product') {
      const product = await Product.findByPk(item_id);
      itemDetails = {
        code: product.code,
        name: product.name,
        unit: product.unit
      };
    } else if (item_type === 'semi_finished') {
      const semiProduct = await SemiFinishedProduct.findByPk(item_id);
      itemDetails = {
        code: semiProduct.code,
        name: semiProduct.name,
        unit: semiProduct.unit
      };
    }
    
    const result = transaction.toJSON();
    result.item_details = itemDetails;
    
    return res.status(201).json(result);
  } catch (error) {
    await t.rollback();
    console.error('Error creating inventory transaction:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}; 