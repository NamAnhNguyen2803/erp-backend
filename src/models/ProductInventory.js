const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/database');

class ProductInventory extends Model {}

ProductInventory.init({
  inventory_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  product_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'products',
      key: 'id'
    }
  },
  warehouse_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'warehouses',
      key: 'id'
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
  },
}, {
  sequelize,
  modelName: 'ProductInventory',
  tableName: 'product_inventory',
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['product_id', 'warehouse_id']
    }
  ]
});
module.exports = ProductInventory; 