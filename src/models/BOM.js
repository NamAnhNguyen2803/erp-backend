const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Product = require('./Product');
const User = require('./User');
const ManufacturingOrder = require('./ManufacturingOrder');

const BOM = sequelize.define('BOM', {
  bom_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  product_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'products',
      key: 'product_id'
    }
  },
  version: {
    type: DataTypes.STRING,
    allowNull: false
  },
  order_id: {
    type: DataTypes.INTEGER,
    allowNull: true, // hoặc false nếu bạn muốn bắt buộc liên kết với kế hoạch
    references: {
      model: ManufacturingOrder,
      key: 'order_id'
    }
  },
  created_by: {
  type: DataTypes.INTEGER,
  allowNull: false,
  references: {
    model: 'users',
    key: 'user_id'
  }
},
  notes: {
  type: DataTypes.TEXT
}
}, {
  timestamps: true,
    tableName: 'boms'
});

module.exports = BOM; 