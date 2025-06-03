const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const MaterialStatus = sequelize.define('MaterialStatus', {
  status_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    field: 'status_id'
  },
  work_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'work_id'
  },
  material_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'material_id'
  },
  required_qty: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    comment: 'Số lượng cần thiết (tự động tính từ BOM)',
    field: 'required_qty'
  },
  available_qty: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
    comment: 'Số lượng có sẵn trong kho',
    field: 'available_qty'
  },
  allocated_qty: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
    comment: 'Số lượng đã phân bổ',
    field: 'allocated_qty'
  },
  consumed_qty: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
    comment: 'Số lượng đã sử dụng',
    field: 'consumed_qty'
  },
  unit: {
    type: DataTypes.STRING(20),
    allowNull: false,
    field: 'unit'
  },
  status: {
    type: DataTypes.ENUM('pending', 'ready', 'partial', 'allocated', 'consumed'),
    defaultValue: 'pending',
    comment: 'Trạng thái: pending=chưa kiểm tra, ready=đủ NVL, partial=thiếu NVL, allocated=đã cấp phát, consumed=đã sử dụng',
    field: 'status'
  },
  shortage_qty: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
    comment: 'Số lượng thiếu = required_qty - available_qty',
    field: 'shortage_qty'
  },
  last_checked: {
    type: DataTypes.DATE,
    comment: 'Lần cuối kiểm tra kho',
    field: 'last_checked'
  },
  notes: {
    type: DataTypes.TEXT,
    field: 'notes'
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    field: 'created_at'
  },
  updated_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    field: 'updated_at'
  }
}, {
  timestamps: false,
  tableName: 'material_status',
  indexes: [
    {
      unique: true,
      fields: ['work_id', 'material_id']
    },
    {
      fields: ['work_id']
    },
    {
      fields: ['material_id']
    },
    {
      fields: ['status']
    }
  ]
});

module.exports = MaterialStatus;
