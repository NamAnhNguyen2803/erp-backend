const { Op } = require('sequelize');
const sequelize = require('../config/database');
const ProductInventory = require('../models/ProductInventory');
const MaterialInventory = require('../models/MaterialInventory');
const SemiProductInventory = require('../models/SemiProductInventory');
const InventoryTransaction = require('../models/InventoryTransaction');

class InventoryService {
  async transferInventory(params) {
    const {
      itemId,
      itemType,
      fromWarehouseId,
      toWarehouseId,
      quantity,
      referenceType,
      referenceId,
      notes
    } = params;

    const transaction = await sequelize.transaction();

    try {
      // Get source inventory
      const sourceInventory = await this.getInventoryModel(itemType).findOne({
        where: {
          [this.getItemIdField(itemType)]: itemId,
          warehouse_id: fromWarehouseId
        },
        transaction
      });

      if (!sourceInventory || sourceInventory.quantity < quantity) {
        throw new Error('Insufficient inventory in source warehouse');
      }

      // Get or create destination inventory
      const [destInventory] = await this.getInventoryModel(itemType).findOrCreate({
        where: {
          [this.getItemIdField(itemType)]: itemId,
          warehouse_id: toWarehouseId
        },
        defaults: {
          quantity: 0,
          unit: sourceInventory.unit
        },
        transaction
      });

      // Update quantities
      await sourceInventory.update({
        quantity: sourceInventory.quantity - quantity
      }, { transaction });

      await destInventory.update({
        quantity: destInventory.quantity + quantity
      }, { transaction });

      // Create transaction record
      await InventoryTransaction.create({
        item_id: itemId,
        item_type: itemType,
        warehouse_id: fromWarehouseId,
        quantity: -quantity,
        transaction_type: 'transfer_out',
        reference_type: referenceType,
        reference_id: referenceId,
        notes
      }, { transaction });

      await InventoryTransaction.create({
        item_id: itemId,
        item_type: itemType,
        warehouse_id: toWarehouseId,
        quantity: quantity,
        transaction_type: 'transfer_in',
        reference_type: referenceType,
        reference_id: referenceId,
        notes
      }, { transaction });

      await transaction.commit();
      return true;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async consumeInventory(params) {
    const {
      itemId,
      itemType,
      warehouseId,
      quantity,
      referenceType,
      referenceId,
      notes
    } = params;

    const transaction = await sequelize.transaction();

    try {
      const inventory = await this.getInventoryModel(itemType).findOne({
        where: {
          [this.getItemIdField(itemType)]: itemId,
          warehouse_id: warehouseId
        },
        transaction
      });

      if (!inventory || inventory.quantity < quantity) {
        throw new Error('Insufficient inventory');
      }

      await inventory.update({
        quantity: inventory.quantity - quantity
      }, { transaction });

      await InventoryTransaction.create({
        item_id: itemId,
        item_type: itemType,
        warehouse_id: warehouseId,
        quantity: -quantity,
        transaction_type: 'consume',
        reference_type: referenceType,
        reference_id: referenceId,
        notes
      }, { transaction });

      await transaction.commit();
      return true;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async produceInventory(params) {
    const {
      itemId,
      itemType,
      warehouseId,
      quantity,
      referenceType,
      referenceId,
      notes
    } = params;

    const transaction = await sequelize.transaction();

    try {
      const [inventory] = await this.getInventoryModel(itemType).findOrCreate({
        where: {
          [this.getItemIdField(itemType)]: itemId,
          warehouse_id: warehouseId
        },
        defaults: {
          quantity: 0,
          unit: params.unit
        },
        transaction
      });

      await inventory.update({
        quantity: inventory.quantity + quantity
      }, { transaction });

      await InventoryTransaction.create({
        item_id: itemId,
        item_type: itemType,
        warehouse_id: warehouseId,
        quantity: quantity,
        transaction_type: 'produce',
        reference_type: referenceType,
        reference_id: referenceId,
        notes
      }, { transaction });

      await transaction.commit();
      return true;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async stockIn(params) {
    const {
      itemId,
      itemType,
      warehouseId,
      quantity,
      unit,
      referenceType,
      referenceId,
      notes,
      createdBy
    } = params;

    const transaction = await sequelize.transaction();

    try {
      // Get or create inventory record
      const [inventory] = await this.getInventoryModel(itemType).findOrCreate({
        where: {
          [this.getItemIdField(itemType)]: itemId,
          warehouse_id: warehouseId
        },
        defaults: {
          quantity: 0,
          unit
        },
        transaction
      });

      // Update quantity
      await inventory.update({
        quantity: inventory.quantity + quantity
      }, { transaction });

      // Create transaction record
      await InventoryTransaction.create({
        item_id: itemId,
        item_type: itemType,
        warehouse_id: warehouseId,
        quantity: quantity,
        transaction_type: 'stock_in',
        reference_type: referenceType,
        reference_id: referenceId,
        notes,
        created_by: createdBy
      }, { transaction });

      await transaction.commit();
      return inventory;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async stockOut(params) {
    const {
      itemId,
      itemType,
      warehouseId,
      quantity,
      referenceType,
      referenceId,
      notes,
      createdBy
    } = params;

    const transaction = await sequelize.transaction();

    try {
      const inventory = await this.getInventoryModel(itemType).findOne({
        where: {
          [this.getItemIdField(itemType)]: itemId,
          warehouse_id: warehouseId
        },
        transaction
      });

      if (!inventory || inventory.quantity < quantity) {
        throw new Error('Insufficient inventory');
      }

      // Update quantity
      await inventory.update({
        quantity: inventory.quantity - quantity
      }, { transaction });

      // Create transaction record
      await InventoryTransaction.create({
        item_id: itemId,
        item_type: itemType,
        warehouse_id: warehouseId,
        quantity: -quantity,
        transaction_type: 'stock_out',
        reference_type: referenceType,
        reference_id: referenceId,
        notes,
        created_by: createdBy
      }, { transaction });

      await transaction.commit();
      return inventory;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async getInventorySummary(params = {}) {
    const { warehouseId, itemType } = params;
    let whereClause = {};
    
    if (warehouseId) {
      whereClause.warehouse_id = warehouseId;
    }

    const summary = await sequelize.query(`
      SELECT * FROM inventory_summary
      WHERE 1=1
      ${warehouseId ? 'AND warehouse_id = :warehouseId' : ''}
      ${itemType ? 'AND item_type = :itemType' : ''}
    `, {
      replacements: { warehouseId, itemType },
      type: sequelize.QueryTypes.SELECT
    });

    return summary;
  }

  async getInventoryByItem(itemId, itemType, warehouseId = null) {
    const whereClause = {
      [this.getItemIdField(itemType)]: itemId
    };

    if (warehouseId) {
      whereClause.warehouse_id = warehouseId;
    }

    const inventory = await this.getInventoryModel(itemType).findAll({
      where: whereClause,
      include: ['warehouse']
    });

    return inventory;
  }

  getInventoryModel(itemType) {
    switch (itemType) {
      case 'product':
        return ProductInventory;
      case 'material':
        return MaterialInventory;
      case 'semi_product':
        return SemiProductInventory;
      default:
        throw new Error('Invalid item type');
    }
  }

  getItemIdField(itemType) {
    switch (itemType) {
      case 'product':
        return 'product_id';
      case 'material':
        return 'material_id';
      case 'semi_product':
        return 'semi_product_id';
      default:
        throw new Error('Invalid item type');
    }
  }
}

module.exports = new InventoryService(); 