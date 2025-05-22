const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const WorkOrder = require('./WorkOrder');
const User = require('./User');

const ManufactureLog = sequelize.define('ManufactureLog', {
  log_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    field: 'log_id'
  },
  work_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: WorkOrder,
      key: 'work_id'
    },
    field: 'work_id'
  },
  action: {
    type: DataTypes.STRING(50),
    allowNull: false,
    comment: 'start, pause, resume, complete, issue, quality_check, rework',
    field: 'action'
  },
  quantity: {
    type: DataTypes.DECIMAL(10, 2),
    field: 'quantity'
  },
  log_time: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    field: 'log_time'
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
  tableName: 'manufacturing_logs'
});

// Thêm aliases cho các mối quan hệ
ManufactureLog.associate = function(models) {
  ManufactureLog.belongsTo(models.WorkOrder, { 
    foreignKey: 'work_id'
  });
  
  ManufactureLog.belongsTo(models.User, { 
    foreignKey: 'created_by',
    as: 'CreatedByUser'
  });
};

module.exports = ManufactureLog; 