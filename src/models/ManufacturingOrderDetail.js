const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const ManufacturingOrder = require('./ManufacturingOrder');
const BOM = require('./BOM');
const SemiBOM = require('./SemiBom'); 

const ManufacturingOrderDetail = sequelize.define('ManufacturingOrderDetail', {
  detail_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  order_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: ManufacturingOrder,
      key: 'order_id'
    }
  },
  item_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: 'ID sản phẩm hoặc bán thành phẩm'
  },
  item_type: {
    type: DataTypes.ENUM('product', 'semi_product'),
    allowNull: false,
    comment: 'Loại item: product hoặc semi_product'
  },
  quantity: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    comment: 'Số lượng cần sản xuất'
  },
  produced_qty: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
    comment: 'Số lượng đã sản xuất'
  },
  bom_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: BOM,
      key: 'bom_id'
    },
    comment: 'BOM sử dụng (nếu có nhiều phiên bản BOM)'
  },
  semi_bom_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: SemiBOM,
      key: 'semi_bom_id'
    },
    comment: 'BOM bán thành phẩm'
  },
  specification: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Yêu cầu kỹ thuật đặc biệt'
  },
  planned_start: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Thời gian dự kiến bắt đầu'
  },
  planned_end: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Thời gian dự kiến hoàn thành'
  },
  priority: {
    type: DataTypes.ENUM('urgent', 'high', 'normal', 'low'),
    defaultValue: 'normal',
    comment: 'Độ ưu tiên riêng cho item này'
  },
  status: {
    type: DataTypes.ENUM('pending', 'in_progress', 'completed'),
    defaultValue: 'pending',
    comment: 'Trạng thái sản xuất'
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  updated_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  timestamps: true,
  tableName: 'ManufacturingOrderDetails',
  indexes: [
    {
      unique: true,
      fields: ['order_id', 'item_id', 'item_type']
    }
  ]
});

module.exports = ManufacturingOrderDetail;