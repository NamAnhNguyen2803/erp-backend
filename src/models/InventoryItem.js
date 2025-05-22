const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const InventoryItem = sequelize.define('InventoryItem', {
  item_uid: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    field: 'item_uid'
  },
  item_type: {
    type: DataTypes.STRING(20),
    allowNull: false,
    field: 'item_type'
  },
  item_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'item_id'
  }
}, {
  timestamps: true,
  tableName: 'inventory_items',
  indexes: [
    {
      name: 'inventory_item_type_id_unique',
      unique: true,
      fields: ['item_type', 'item_id']
    }
  ]
});

// Define polymorphic associations
InventoryItem.associate = (models) => {
  InventoryItem.belongsTo(models.Material, {
    foreignKey: 'item_id',
    constraints: false,
    scope: {
      item_type: 'material'
    }
  });

  InventoryItem.belongsTo(models.SemiFinishedProduct, {
    foreignKey: 'item_id',
    constraints: false,
    scope: {
      item_type: 'semi_finished_product'
    }
  });

  InventoryItem.belongsTo(models.Product, {
    foreignKey: 'item_id',
    constraints: false,
    scope: {
      item_type: 'product'
    }
  });
};

module.exports = InventoryItem; 