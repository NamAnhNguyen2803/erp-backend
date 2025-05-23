const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/database');

class SemiBomItem extends Model {}

SemiBomItem.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  semi_bom_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'semi_BOMs',
      key: 'id'
    }
  },
  item_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: 'ID of the material or semi-finished product'
  },
  item_type: {
    type: DataTypes.ENUM('material', 'semi_product'),
    allowNull: false,
    comment: 'Type of the item (material or semi-finished product)'
  },
  quantity: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 1
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
  modelName: 'SemiBomItem',
  tableName: 'semi_BOM_items',
  timestamps: true,
  underscored: true,
  indexes: [
    {
      fields: ['semi_bom_id']
    },
    {
      fields: ['item_id', 'item_type']
    }
  ]
});

// Define associations
SemiBomItem.associate = (models) => {
  SemiBomItem.belongsTo(models.SemiBom, {
    foreignKey: 'semi_bom_id',
    as: 'bom'
  });

  // Polymorphic association for item
  SemiBomItem.belongsTo(models.Material, {
    foreignKey: 'item_id',
    constraints: false,
    scope: {
      item_type: 'material'
    },
    as: 'material'
  });

  SemiBomItem.belongsTo(models.SemiFinishedProduct, {
    foreignKey: 'item_id',
    constraints: false,
    scope: {
      item_type: 'semi_product'
    },
    as: 'semiProduct'
  });
};

module.exports = SemiBomItem; 