const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const User = require('./User');

const ManufacturingPlan = sequelize.define('ManufacturingPlan', {
  plan_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  plan_code: {
    type: DataTypes.STRING(50),
    allowNull: false
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
    type: DataTypes.STRING(20),
    allowNull: false, 
    defaultValue: 'draft'
  },
  created_by: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: User,
      key: 'user_id'
    }
  },
  notes: {
    type: DataTypes.TEXT
  },
  priority: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  timestamps: true,
  tableName: 'ManufacturingPlans',
  indexes: [
    {
      unique: true,
      fields: ['plan_code'],
      name: 'manufacturing_plan_plan_code_unique'
    }
  ]
});

module.exports = ManufacturingPlan; 