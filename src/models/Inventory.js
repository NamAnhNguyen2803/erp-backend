const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Warehouse = require('./Warehouse');

const Inventory = sequelize.define('Inventory', {
  inventory_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  item_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  item_type: {
    type: DataTypes.STRING(20),
    allowNull: false,
    comment: 'material, semi_product, product'
  },
  warehouse_id: {
    type: DataTypes.INTEGER,
    references: {
      model: Warehouse,
      key: 'warehouse_id'
    }
  },
  location: {
    type: DataTypes.STRING(50)
  },
  quantity: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  last_updated: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  timestamps: true,
  tableName: 'Inventory'
});

module.exports = Inventory; 