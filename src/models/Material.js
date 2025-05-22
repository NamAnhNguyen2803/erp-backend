const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Material = sequelize.define('Material', {
  material_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    field: 'material_id'
  },
  code: {
    type: DataTypes.STRING(50),
    allowNull: false,
    field: 'code'
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    field: 'name'
  },
  specification: {
    type: DataTypes.TEXT,
    field: 'specification'
  },
  unit: {
    type: DataTypes.STRING(20),
    allowNull: false,
    field: 'unit'
  },
  min_stock: {
    type: DataTypes.DECIMAL(10, 2),
    field: 'min_stock'
  },
  max_stock: {
    type: DataTypes.DECIMAL(10, 2),
    field: 'max_stock'
  },
  current_stock: {
    type: DataTypes.DECIMAL(10, 2),
    field: 'current_stock'
  },
  unit_price: {
    type: DataTypes.DECIMAL(15, 2),
    field: 'unit_price'
  },
  supplier: {
    type: DataTypes.STRING(100),
    field: 'supplier'
  },
  status: {
    type: DataTypes.STRING(20),
    defaultValue: 'active',
    field: 'status'
  }
}, {
  timestamps: true,
  tableName: 'materials',
  indexes: [
    {
      name: 'material_code_unique',
      unique: true,
      fields: ['code']
    }
  ]
});

module.exports = Material; 