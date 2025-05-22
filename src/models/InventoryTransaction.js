const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Warehouse = require('./Warehouse');
const User = require('./User');

const InventoryTransaction = sequelize.define('InventoryTransaction', {
  transaction_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    field: 'transaction_id'
  },
  transaction_type: {
    type: DataTypes.STRING(20),
    allowNull: false,
    comment: 'import, export, transfer',
    field: 'transaction_type'
  },
  item_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'item_id'
  },
  item_type: {
    type: DataTypes.STRING(20),
    allowNull: false,
    comment: 'material, product, semi_finished',
    field: 'item_type'
  },
  from_warehouse_id: {
    type: DataTypes.INTEGER,
    references: {
      model: Warehouse,
      key: 'warehouse_id'
    },
    field: 'from_warehouse_id'
  },
  to_warehouse_id: {
    type: DataTypes.INTEGER,
    references: {
      model: Warehouse,
      key: 'warehouse_id'
    },
    field: 'to_warehouse_id'
  },
  quantity: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    field: 'quantity'
  },
  transaction_date: {
    type: DataTypes.DATE,
    allowNull: false,
    field: 'transaction_date'
  },
  reference_id: {
    type: DataTypes.INTEGER,
    field: 'reference_id'
  },
  reference_type: {
    type: DataTypes.STRING(50),
    field: 'reference_type'
  },
  created_by: {
    type: DataTypes.INTEGER,
    references: {
      model: User,
      key: 'user_id'
    },
    field: 'created_by'
  }
}, {
  timestamps: true,
  tableName: 'inventory_transactions'
});

module.exports = InventoryTransaction; 