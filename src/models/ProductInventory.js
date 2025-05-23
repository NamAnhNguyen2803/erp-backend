const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/database');

class ProductInventory extends Model {}

ProductInventory.init({
  id: {
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
  created_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  updated_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  }
}, {
  sequelize,
  modelName: 'ProductInventory',
  tableName: 'product_inventory',
  timestamps: true,
  underscored: true,
  indexes: [
    {
      unique: true,
      fields: ['product_id', 'warehouse_id']
    }
  ]
});

// Define associations
ProductInventory.associate = (models) => {
  ProductInventory.belongsTo(models.Product, {
    foreignKey: 'product_id',
    as: 'product'
  });
  ProductInventory.belongsTo(models.Warehouse, {
    foreignKey: 'warehouse_id',
    as: 'warehouse'
  });
};

module.exports = ProductInventory; 