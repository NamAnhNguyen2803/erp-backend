const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const SemiFinishedProduct = sequelize.define('SemiFinishedProduct', {
  semi_product_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    field: 'semi_product_id'
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
  description: {
    type: DataTypes.TEXT,
    field: 'description'
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
  cost_price: {
    type: DataTypes.DECIMAL(15, 2),
    field: 'cost_price'
  },
  status: {
    type: DataTypes.STRING(20),
    defaultValue: 'active',
    field: 'status'
  }
}, {
  timestamps: true,
  tableName: 'semi_finished_products',
  indexes: [
    {
      name: 'semi_product_code_unique',
      unique: true,
      fields: ['code']
    }
  ]
});

module.exports = SemiFinishedProduct; 