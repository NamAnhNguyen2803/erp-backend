const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const ManufacturingOrder = require('./ManufacturingOrder');
const User = require('./User');

const ManufacturingCost = sequelize.define('ManufacturingCost', {
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
      model: ManufacturingOrder,
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
ManufacturingCost.associate = function(models) {
  ManufacturingCost.belongsTo(models.ManufacturingOrder, { 
    foreignKey: 'order_id'
  });
  
  ManufacturingCost.belongsTo(models.User, { 
    foreignKey: 'created_by',
    as: 'CreatedByUser'
  });
};

module.exports = ManufacturingCost; 