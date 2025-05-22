const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const ManufacturePlan = require('./ManufacturePlan');
const Product = require('./Product');
const BOM = require('./BOM');
const User = require('./User');

const ManufactureOrder = sequelize.define('ManufactureOrder', {
  order_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  order_number: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true
  },
  plan_id: {
    type: DataTypes.INTEGER,
    references: {
      model: ManufacturePlan,
      key: 'plan_id'
    }
  },
  product_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Product,
      key: 'product_id'
    }
  },
  bom_id: {
    type: DataTypes.INTEGER,
    references: {
      model: BOM,
      key: 'bom_id'
    }
  },
  quantity: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  start_date: {
    type: DataTypes.DATE
  },
  end_date: {
    type: DataTypes.DATE
  },
  status: {
    type: DataTypes.STRING(20),
    allowNull: false,
    defaultValue: 'draft'
  },
  total_cost: {
    type: DataTypes.DECIMAL(15, 2)
  },
  created_by: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: User,
      key: 'user_id'
    }
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  timestamps: true,
  tableName: 'ManufacturingOrders'
});

module.exports = ManufactureOrder; 