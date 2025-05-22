const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const ManufactureOrder = require('./ManufactureOrder');
const User = require('./User');

const ManufactureCost = sequelize.define('ManufactureCost', {
  cost_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    field: 'cost_id'
  },
  order_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: ManufactureOrder,
      key: 'order_id'
    },
    field: 'order_id'
  },
  cost_type: {
    type: DataTypes.STRING(50),
    allowNull: false,
    comment: 'material, labor, overhead, other',
    field: 'cost_type'
  },
  amount: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false,
    field: 'amount'
  },
  cost_date: {
    type: DataTypes.DATE,
    field: 'cost_date'
  },
  notes: {
    type: DataTypes.TEXT,
    field: 'notes'
  },
  created_by: {
    type: DataTypes.INTEGER,
    references: {
      model: User,
      key: 'user_id'
    },
    field: 'created_by'
  }
}, {
  timestamps: true,
  tableName: 'manufacturing_costs'
});

// Thêm aliases cho các mối quan hệ
ManufactureCost.associate = function(models) {
  ManufactureCost.belongsTo(models.ManufactureOrder, { 
    foreignKey: 'order_id'
  });
  
  ManufactureCost.belongsTo(models.User, { 
    foreignKey: 'created_by',
    as: 'CreatedByUser'
  });
};

module.exports = ManufactureCost; 