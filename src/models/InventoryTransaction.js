// InventoryTransaction.js
const { DataTypes, Sequelize } = require('sequelize');
const sequelize = require('../config/database'); // Đường dẫn config DB của bạn

const InventoryTransaction = sequelize.define('InventoryTransaction', {
  transaction_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  transaction_type: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  item_type: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  item_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  from_warehouse_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  to_warehouse_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  quantity: {
    type: DataTypes.FLOAT,
    allowNull: false,
  },
  created_by: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
}, {
  tableName: 'inventory_transactions',
  timestamps: true,
  underscored: true,
});

module.exports = InventoryTransaction;
