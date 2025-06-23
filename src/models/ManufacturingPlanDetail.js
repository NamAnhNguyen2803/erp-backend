const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const ManufacturingPlan = require('./ManufacturingPlan');
const Product = require('./Product');

const ManufacturingPlanDetail = sequelize.define('ManufacturingPlanDetail', {
  detail_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  plan_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: ManufacturingPlan,
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
  quantity: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  planned_start_date: {
    type: DataTypes.DATE
  },
  planned_end_date: {
    type: DataTypes.DATE
  }
}, {
  timestamps: true,
  tableName: 'manufacturing_plan_details',
  freezeTableName: true
});

module.exports = ManufacturingPlanDetail; 