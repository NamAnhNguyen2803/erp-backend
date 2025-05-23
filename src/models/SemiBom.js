const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/database');

class SemiBom extends Model {}

SemiBom.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  semi_product_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'semi_finished_products',
      key: 'id'
    }
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  version: {
    type: DataTypes.STRING(20),
    allowNull: false,
    defaultValue: '1.0'
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
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
  modelName: 'SemiBom',
  tableName: 'semi_BOMs',
  timestamps: true,
  underscored: true,
  indexes: [
    {
      unique: true,
      fields: ['semi_product_id', 'version']
    }
  ]
});

// Define associations
SemiBom.associate = (models) => {
  SemiBom.belongsTo(models.SemiFinishedProduct, {
    foreignKey: 'semi_product_id',
    as: 'semiProduct'
  });
  
  SemiBom.hasMany(models.SemiBomItem, {
    foreignKey: 'semi_bom_id',
    as: 'items'
  });
};

module.exports = SemiBom; 