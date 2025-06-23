const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const User = require('./User');
const SemiBom = sequelize.define('SemiBom', {
  semi_bom_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  semi_product_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'semi_finished_products',
      key: 'semi_product_id'
    }
  },
  version: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: '1.0'
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
    type: DataTypes.TEXT,
    allowNull: true
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  sequelize,
  modelName: 'SemiBom',
  tableName: 'semi_boms',
  timestamps: true
});

module.exports = SemiBom;
