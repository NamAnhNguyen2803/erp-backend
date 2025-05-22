const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const ManufactureOrder = require('./ManufactureOrder');
const ManufactureStep = require('./ManufactureStep');
const WorkStation = require('./WorkStation');
const SemiFinishedProduct = require('./SemiFinishedProduct');
const User = require('./User');

const WorkOrder = sequelize.define('WorkOrder', {
  work_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    field: 'work_id'
  },
  work_number: {
    type: DataTypes.STRING(50),
    allowNull: false,
    field: 'work_number'
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
  step_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: ManufactureStep,
      key: 'step_id'
    },
    field: 'step_id'
  },
  station_id: {
    type: DataTypes.INTEGER,
    references: {
      model: WorkStation,
      key: 'station_id'
    },
    field: 'station_id'
  },
  semi_product_id: {
    type: DataTypes.INTEGER,
    references: {
      model: SemiFinishedProduct,
      key: 'semi_product_id'
    },
    field: 'semi_product_id'
  },
  planned_quantity: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    field: 'planned_quantity'
  },
  completed_quantity: {
    type: DataTypes.DECIMAL(10, 2),
    field: 'completed_quantity'
  },
  start_time: {
    type: DataTypes.DATE,
    field: 'start_time'
  },
  end_time: {
    type: DataTypes.DATE,
    field: 'end_time'
  },
  status: {
    type: DataTypes.STRING(20),
    allowNull: false,
    defaultValue: 'pending',
    field: 'status'
  },
  assigned_to: {
    type: DataTypes.INTEGER,
    references: {
      model: User,
      key: 'user_id'
    },
    field: 'assigned_to'
  }
}, {
  timestamps: true,
  tableName: 'work_orders'
});

module.exports = WorkOrder; 