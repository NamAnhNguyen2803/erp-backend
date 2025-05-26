const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/database');

class MaterialInventory extends Model {}

MaterialInventory.init({
  inventory_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    field: 'inventory_id' 
  },
  material_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'materials',
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
  modelName: 'MaterialInventory',
  tableName: 'material_inventory',
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['material_id', 'warehouse_id']
    }
  ]
});

module.exports = MaterialInventory; 