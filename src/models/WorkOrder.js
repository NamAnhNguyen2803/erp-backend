const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const ManufacturingOrder = require('./ManufacturingOrder');
const ManufacturingOrderDetail = require('./ManufacturingOrderDetail');
const MaterialStatus = require('./MaterialStatus');
const User = require('./User');
const MaterialStatusController = require('../controllers/materialStatusController');
const generateWorkCode = require('../helper/digitWorkCodeGenerator'); // Import utility function to generate work_code
const { Op } = require('sequelize');
const WorkOrder = sequelize.define('WorkOrder', {
  work_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  work_code: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
    comment: 'Mã công việc duy nhất'
  },
  order_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: ManufacturingOrder,
      key: 'order_id'
    }
  },
  detail_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: ManufacturingOrderDetail,
      key: 'detail_id'
    },
    comment: 'Liên kết cụ thể với order detail'
  },
  process_step: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: 'Công đoạn: cutting, welding, assembly...'
  },
  operation_type: {
    type: DataTypes.ENUM('produce', 'assemble', 'process', 'inspect'),
    allowNull: false,
    comment: 'Loại thao tác'
  },
  work_quantity: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    comment: 'Số lượng trong work order này'
  },
  completed_qty: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
    comment: 'Số lượng đã hoàn thành'
  },
  assigned_to: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: User,
      key: 'user_id'
    },
    comment: 'Người được phân công'
  },
  department: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: 'Phòng ban thực hiện'
  },
  priority: {
    type: DataTypes.ENUM('urgent', 'high', 'normal', 'low'),
    defaultValue: 'normal',
    comment: 'Độ ưu tiên'
  },
  status: {
    type: DataTypes.ENUM('pending', 'in_progress', 'completed', 'paused', 'cancelled'),
    defaultValue: 'pending',
    comment: 'Trạng thái work order'
  },
  planned_start: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Thời gian dự kiến bắt đầu'
  },
  planned_end: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Thời gian dự kiến kết thúc'
  },
  actual_start: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Thời gian thực tế bắt đầu'
  },
  actual_end: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Thời gian thực tế kết thúc'
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Mô tả công việc cụ thể'
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Ghi chú thêm'
  }
}, {
  timestamps: true,
  tableName: 'workorders'
});

WorkOrder.beforeCreate(async (workOrder, options) => {
  // Tạo mã dạng: WO20250601-001 (ngày + số thứ tự)
  const datePrefix = `WO${new Date().toISOString().slice(0,10).replace(/-/g, '')}`; // VD: WO20250601

  const count = await WorkOrder.count({
    where: {
      createdAt: {
        [Op.gte]: new Date().setHours(0,0,0,0), // Tính trong ngày
        [Op.lte]: new Date().setHours(23,59,59,999)
      }
    }
  });

  const nextNumber = (count + 1).toString().padStart(3, '0');
  workOrder.work_code = `${datePrefix}-${nextNumber}`;
});

WorkOrder.beforeValidate(async (workOrder, options) => {
  if (!workOrder.work_code) {
    const datePrefix = `WO${new Date().toISOString().slice(0,10).replace(/-/g, '')}`;

    const count = await WorkOrder.count({
      where: {
        createdAt: {
          [Op.gte]: new Date().setHours(0,0,0,0),
          [Op.lte]: new Date().setHours(23,59,59,999)
        }
      }
    });

    const nextNumber = (count + 1).toString().padStart(3, '0');
    workOrder.work_code = `${datePrefix}-${nextNumber}`;
  }
});


  // WorkOrder.addHook('afterCreate', async (workOrder, options) => {
  //   const { generateMaterialStatus } = require('../controllers/materialStatusController');
  //   try {
  //     await generateMaterialStatus(workOrder.work_id);
  //     console.log(`Material status generated for work ID: ${workOrder.work_id}`);
  //   } catch (error) {
  //     console.error(`Failed to generate material status for work ID: ${workOrder.work_id}`, error);
  //   }
  // });



module.exports = WorkOrder;