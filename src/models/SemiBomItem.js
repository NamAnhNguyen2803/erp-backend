const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const { table } = require('console');

const SemiBomItem = sequelize.define('SemiBomItem', {
  item_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  semi_bom_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      table: 'semi_boms',
      key: 'semi_bom_id'
    }
  },
  material_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'materials',
      key: 'material_id'
    }
  },
  item_type: {
    type: DataTypes.STRING(20),
    allowNull: false,
    comment: 'material, semi_product, product'
  },
  bom_level: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1
  },
  reference: {
    type: DataTypes.STRING(50)
  },
  quantity: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  waste_percent: {
    type: DataTypes.DECIMAL(5, 2),
    defaultValue: 0
  },
  notes: {
    type: DataTypes.TEXT
  }
}, {
  timestamps: true,
  tableName: 'semi_bom_items'
});

module.exports = SemiBomItem;
