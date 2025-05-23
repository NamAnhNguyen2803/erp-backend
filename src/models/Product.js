const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Product = sequelize.define('Product', {
  product_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    field: 'product_id'
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
  cost_price: {
    type: DataTypes.DECIMAL(15, 2),
    field: 'cost_price'
  },
  status: {
    type: DataTypes.STRING(20),
    field: 'status'
  }
}, {
  timestamps: true,
  tableName: 'products',
  indexes: [
    {
      name: 'unique_code_index',
      unique: true,
      fields: ['code']
    }
  ]
});

module.exports = Product;
