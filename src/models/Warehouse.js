const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Warehouse = sequelize.define('Warehouse', {
  warehouse_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    field: 'warehouse_id'
  },
  code: {
    type: DataTypes.STRING(20),
    allowNull: false,
    field: 'code'
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    field: 'name'
  },
  location: {
    type: DataTypes.STRING(255),
    field: 'location'
  },
  description: {
    type: DataTypes.TEXT,
    field: 'description'
  },
  manager: {
    type: DataTypes.STRING(100),
    field: 'manager'
  },
  contact: {
    type: DataTypes.STRING(50),
    field: 'contact'
  },
  capacity: {
    type: DataTypes.DECIMAL(10, 2),
    field: 'capacity'
  },
  capacity_unit: {
    type: DataTypes.STRING(20)
  },
  status: {
    type: DataTypes.STRING(20),
    defaultValue: 'active',
    field: 'status'
  }
}, {
  timestamps: true,
  tableName: 'warehouses',
  indexes: [
    {
      name: 'warehouse_code_unique',
      unique: true,
      fields: ['code']
    }
  ]
});

module.exports = Warehouse; 