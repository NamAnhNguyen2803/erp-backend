const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const ManufacturingPlan = require('./ManufacturingPlan');
const BOM = require('./BOM');
const User = require('./User');

const ManufacturingOrder = sequelize.define('ManufacturingOrder', {
  order_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  order_code: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true
  },
  description: {
    type: DataTypes.TEXT
  },
  start_date: {
    type: DataTypes.DATE
  },
  end_date: {
    type: DataTypes.DATE
  },
  status: {
    type: DataTypes.ENUM('pending', 'approved', 'in_progress', 'completed', 'cancelled'),
    allowNull: false,
    defaultValue: 'pending'
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
  tableName: 'manufacturing_orders',
  freezeTableName: true
});

module.exports = ManufacturingOrder; 