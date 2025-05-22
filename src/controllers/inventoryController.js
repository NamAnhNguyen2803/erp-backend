const { Inventory, Warehouse, Product, Material, SemiFinishedProduct } = require('../models');
const { Op } = require('sequelize');

// Get all inventory items with pagination and filters
exports.getAllInventory = async (req, res) => {
  try {
    const { page = 1, limit = 10, warehouse_id, item_type } = req.query;
    const offset = (page - 1) * limit;
    
    // Build filter condition
    const where = {};
    if (warehouse_id) where.warehouse_id = warehouse_id;
    if (item_type) where.item_type = item_type;
    
    // Find inventory with pagination
    const { count, rows } = await Inventory.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset: parseInt(offset),
      include: [
        {
          model: Warehouse,
          attributes: ['warehouse_id', 'code', 'name', 'type']
        }
      ],
      attributes: ['inventory_id', 'item_id', 'item_type', 'warehouse_id', 'location', 'quantity', 'last_updated'],
      order: [['inventory_id', 'DESC']]
    });
    
    // Get item details based on item_type
    const inventoryWithDetails = await Promise.all(
      rows.map(async (item) => {
        const inventory = item.toJSON();
        
        try {
          // Get item details based on item_type
          if (inventory.item_type === 'material') {
            const material = await Material.findByPk(inventory.item_id);
            if (material) {
              inventory.item_details = {
                code: material.code,
                name: material.name,
                unit: material.unit
              };
            }
          } else if (inventory.item_type === 'semi_product') {
            const semiProduct = await SemiFinishedProduct.findByPk(inventory.item_id);
            if (semiProduct) {
              inventory.item_details = {
                code: semiProduct.code,
                name: semiProduct.name,
                unit: semiProduct.unit
              };
            }
          } else if (inventory.item_type === 'product') {
            const product = await Product.findByPk(inventory.item_id);
            if (product) {
              inventory.item_details = {
                code: product.code,
                name: product.name,
                unit: product.unit
              };
            }
          }
        } catch (error) {
          console.error(`Error fetching details for item: ${inventory.item_id}`, error);
        }
        
        return inventory;
      })
    );
    
    return res.status(200).json({
      inventory: inventoryWithDetails,
      total: count,
      page: parseInt(page),
      limit: parseInt(limit)
    });
  } catch (error) {
    console.error('Error getting inventory:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// Get inventory item by ID
exports.getInventoryById = async (req, res) => {
  try {
    const { inventory_id } = req.params;
    const inventory = await Inventory.findByPk(inventory_id, {
      include: [
        {
          model: Warehouse,
          attributes: ['warehouse_id', 'code', 'name', 'type']
        }
      ]
    });
    
    if (!inventory) {
      return res.status(404).json({ message: 'Inventory record not found' });
    }
    
    const result = inventory.toJSON();
    
    // Get item details based on item_type
    try {
      if (result.item_type === 'material') {
        const material = await Material.findByPk(result.item_id);
        if (material) {
          result.item_details = {
            code: material.code,
            name: material.name,
            unit: material.unit
          };
        }
      } else if (result.item_type === 'semi_product') {
        const semiProduct = await SemiFinishedProduct.findByPk(result.item_id);
        if (semiProduct) {
          result.item_details = {
            code: semiProduct.code,
            name: semiProduct.name,
            unit: semiProduct.unit
          };
        }
      } else if (result.item_type === 'product') {
        const product = await Product.findByPk(result.item_id);
        if (product) {
          result.item_details = {
            code: product.code,
            name: product.name,
            unit: product.unit
          };
        }
      }
    } catch (error) {
      console.error(`Error fetching details for item: ${result.item_id}`, error);
    }
    
    return res.status(200).json(result);
  } catch (error) {
    console.error('Error getting inventory item:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// Create new inventory record
exports.createInventory = async (req, res) => {
  try {
    const { item_id, item_type, warehouse_id, location, quantity } = req.body;
    
    // Validate warehouse_id
    const warehouse = await Warehouse.findByPk(warehouse_id);
    if (!warehouse) {
      return res.status(400).json({ message: 'Invalid warehouse_id' });
    }
    
    // Validate item_id based on item_type
    let itemExists = false;
    if (item_type === 'material') {
      const material = await Material.findByPk(item_id);
      itemExists = !!material;
    } else if (item_type === 'semi_product') {
      const semiProduct = await SemiFinishedProduct.findByPk(item_id);
      itemExists = !!semiProduct;
    } else if (item_type === 'product') {
      const product = await Product.findByPk(item_id);
      itemExists = !!product;
    }
    
    if (!itemExists) {
      return res.status(400).json({ message: 'Invalid item_id for the specified item_type' });
    }
    
    // Check if inventory record already exists for this item in this warehouse
    const existingInventory = await Inventory.findOne({
      where: {
        item_id,
        item_type,
        warehouse_id
      }
    });
    
    if (existingInventory) {
      // Update existing record
      existingInventory.quantity += parseFloat(quantity);
      existingInventory.location = location || existingInventory.location;
      existingInventory.last_updated = new Date();
      await existingInventory.save();
      
      return res.status(200).json(existingInventory);
    }
    
    // Create new inventory record
    const newInventory = await Inventory.create({
      item_id,
      item_type,
      warehouse_id,
      location,
      quantity,
      last_updated: new Date()
    });
    
    // Update item's current_stock if applicable
    try {
      if (item_type === 'material') {
        await Material.increment('current_stock', { 
          by: parseFloat(quantity), 
          where: { material_id: item_id } 
        });
      } else if (item_type === 'semi_product') {
        await SemiFinishedProduct.increment('current_stock', { 
          by: parseFloat(quantity), 
          where: { semi_product_id: item_id } 
        });
      } else if (item_type === 'product') {
        await Product.increment('current_stock', { 
          by: parseFloat(quantity), 
          where: { product_id: item_id } 
        });
      }
    } catch (error) {
      console.error('Error updating item current_stock:', error);
    }
    
    return res.status(201).json(newInventory);
  } catch (error) {
    console.error('Error creating inventory record:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// Update inventory record
exports.updateInventory = async (req, res) => {
  try {
    const { inventory_id } = req.params;
    const { quantity, location } = req.body;
    
    // Find inventory by ID
    const inventory = await Inventory.findByPk(inventory_id);
    if (!inventory) {
      return res.status(404).json({ message: 'Inventory record not found' });
    }
    
    // Calculate the difference in quantity
    const quantityDifference = quantity !== undefined ? parseFloat(quantity) - inventory.quantity : 0;
    
    // Update inventory fields
    await inventory.update({
      quantity: quantity !== undefined ? parseFloat(quantity) : inventory.quantity,
      location: location || inventory.location,
      last_updated: new Date()
    });
    
    // Update item's current_stock if quantity changed
    if (quantityDifference !== 0) {
      try {
        if (inventory.item_type === 'material') {
          await Material.increment('current_stock', { 
            by: quantityDifference, 
            where: { material_id: inventory.item_id } 
          });
        } else if (inventory.item_type === 'semi_product') {
          await SemiFinishedProduct.increment('current_stock', { 
            by: quantityDifference, 
            where: { semi_product_id: inventory.item_id } 
          });
        } else if (inventory.item_type === 'product') {
          await Product.increment('current_stock', { 
            by: quantityDifference, 
            where: { product_id: inventory.item_id } 
          });
        }
      } catch (error) {
        console.error('Error updating item current_stock:', error);
      }
    }
    
    return res.status(200).json(inventory);
  } catch (error) {
    console.error('Error updating inventory record:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}; 