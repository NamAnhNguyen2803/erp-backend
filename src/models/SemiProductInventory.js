const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/database');

class SemiProductInventory extends Model {}

SemiProductInventory.init({
  inventory_id: {
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
  warehouse_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'warehouses',
      key: 'warehouse_id'
    }
  },
  quantity: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0
  },
  unit: {
    type: DataTypes.STRING(20),
    allowNull: false
  }
}, {
  sequelize,
  modelName: 'SemiProductInventory',
  tableName: 'semi_product_inventory',
  timestamps: true,
  // underscored: true,
  indexes: [
    {
      unique: true,
      fields: ['semi_product_id', 'warehouse_id']
    }
  ]
});

module.exports = SemiProductInventory; 