const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ManufactureStep = sequelize.define('ManufactureStep', {
  step_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT
  },
  sequence: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  estimated_time: {
    type: DataTypes.INTEGER, // in minutes
    allowNull: false
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  timestamps: true,
  tableName: 'ManufacturingSteps'
});

module.exports = ManufactureStep; 