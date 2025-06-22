const sequelize = require('../config/database');
const WorkOrder = require('../models/WorkOrder');
const ManufacturingOrder = require('../models/ManufacturingOrder');
const ManufacturingOrderDetail = require('../models/ManufacturingOrderDetail');
const Material = require('../models/Material');
const MaterialInventory = require('../models/MaterialInventory');
const SemiFinishedProduct = require('../models/SemiFinishedProduct');
const Product = require('../models/Product');
const MaterialRequirement = require('../models/MaterialRequirement');
const User = require('../models/User');
const { Op } = require('sequelize');
const { generateWorkCode, } = require('../helper/digitWorkCodeGenerator');
const { inventoryHelper } = require('../helper/inventoryHelper');
const InventoryItem = require('../models/InventoryItem');
const MaterialStatusController = require('./materialStatusController');
const { createMaterialRequirement } = require('./materialRequirementController');
const BOM = require('../models/BOM');
const BOMItem = require('../models/BOMItem');
const { exportGoodsLogic, importGoodsLogic } = require('./inventoryTransactionController'); // Assuming you have these functions in inventoryController.js
class WorkOrderController {
  // Lấy danh sách work orders
  static async getAll(req, res) {
    try {
      const {
        page = 1,
        limit = 10,
        status,
        assigned_to,
        priority,
        operation_type,
        search
      } = req.query;

      const offset = (page - 1) * limit;
      const where = {};

      // Filters
      if (status) where.status = status;
      if (assigned_to) where.assigned_to = assigned_to;
      if (priority) where.priority = priority;
      if (operation_type) where.operation_type = operation_type;
      if (search) {
        where[Op.or] = [
          { work_code: { [Op.like]: `%${search}%` } },
          { description: { [Op.like]: `%${search}%` } }
        ];
      }

      const { count, rows } = await WorkOrder.findAndCountAll({
        where,
        include: [
          { model: ManufacturingOrder, as: 'ManufacturingOrder' },
          { model: ManufacturingOrderDetail, as: 'ManufacturingOrderDetail' },
          { model: User, as: 'AssignedUser', attributes: ['user_id', 'username', 'fullname'] }
        ],
        limit: parseInt(limit),
        offset,
        order: [['createdAt', 'DESC']]
      });

      res.json({
        success: true,
        data: {
          workOrders: rows,
          pagination: {
            total: count,
            page: parseInt(page),
            limit: parseInt(limit),
            totalPages: Math.ceil(count / limit)
          }
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Lấy chi tiết work order
  static async getByWorkId(req, res) {
    try {
      const { id } = req.params; // work_id

      const workOrders = await WorkOrder.findAll({
        where: { work_id: id },
        include: [
          { model: ManufacturingOrder },
          { model: ManufacturingOrderDetail },
          { model: User, as: 'AssignedUser', attributes: ['user_id', 'username', 'fullname'] }
        ]
      });

      if (!workOrders || workOrders.length === 0) {
        return res.json({ success: true, data: null }); // trả về null nếu không có
      }

      const rawWorkOrders = workOrders.map(wo => {
        const data = wo.toJSON();
        const detail = data.ManufacturingOrderDetail;

        return {
          ...data,
          item_type: detail?.item_type || null,
          item_id: detail?.item_id || null
        };
      });

      const enrichedWorkOrders = await inventoryHelper(rawWorkOrders);

      // Trả về đối tượng đầu tiên, không phải mảng
      res.json({ success: true, data: enrichedWorkOrders[0] });
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async getByOrderId(req, res) {
    try {
      const { id } = req.params; // order_id

      const workOrders = await WorkOrder.findAll({
        where: { order_id: id },
        include: [
          { model: ManufacturingOrder },
          { model: ManufacturingOrderDetail },
          { model: User, as: 'AssignedUser', attributes: ['user_id', 'username', 'fullname'] }
        ]
      });

      if (!workOrders || workOrders.length === 0) {
        return res.json({ success: true, data: [] }); // Trả về mảng rỗng nếu không có workOrders
      }

      const rawWorkOrders = workOrders.map(wo => {
        const data = wo.toJSON();
        const detail = data.ManufacturingOrderDetail;

        return {
          ...data,
          item_type: detail?.item_type || null,
          item_id: detail?.item_id || null
        };
      });

      const enrichedWorkOrders = await inventoryHelper(rawWorkOrders);

      res.json({ success: true, data: enrichedWorkOrders });
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: error.message });
    }
  }



  // Tạo work order mới
  static async create(req, res) {
    try {
      const {
        order_id,
        detail_id,
        process_step,
        operation_type,
        work_quantity,
        assigned_to,
        department,
        priority,
        planned_start,
        planned_end,
        description,
        notes
      } = req.body;

      const orderDetail = await ManufacturingOrderDetail.findByPk(detail_id);
      if (!orderDetail) {
        return res.status(404).json({ success: false, message: 'Manufacturing order detail không tồn tại' });
      }

      const existingWorkOrders = await WorkOrder.findAll({ where: { detail_id } });
      const totalWorkQuantity = existingWorkOrders.reduce(
        (sum, wo) => sum + parseFloat(wo.work_quantity),
        0
      );

      if (totalWorkQuantity + parseFloat(work_quantity) > parseFloat(orderDetail.quantity)) {
        return res.status(400).json({
          success: false,
          message: 'Tổng số lượng work orders vượt quá số lượng cần sản xuất'
        });
      }

      const workOrder = await WorkOrder.create({
        order_id,
        detail_id,
        process_step,
        operation_type,
        work_quantity,
        assigned_to,
        department,
        priority,
        planned_start,
        planned_end,
        description,
        notes
      });
      async function createMaterialRequirement(workId, templateMaterials) {
        const entries = templateMaterials.map(mat => ({
          work_id: workId,
          material_id: mat.material_id,
          required_quantity: mat.quantity
        }));
        await MaterialRequirement.bulkCreate(entries);
      }
      return res.status(201).json({ success: true, data: workOrder });

    } catch (error) {
      console.error(error);
      if (error.name === 'SequelizeUniqueConstraintError') {
        return res.status(400).json({ success: false, message: 'Mã work order đã tồn tại' });
      }
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  // Cập nhật work order
  static async update(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const [updatedRows] = await WorkOrder.update(updateData, {
        where: { work_id: id }
      });

      if (updatedRows === 0) {
        return res.status(404).json({
          success: false,
          message: 'Work order không tồn tại'
        });
      }

      const updatedWorkOrder = await WorkOrder.findByPk(id);
      res.json({
        success: true,
        data: updatedWorkOrder
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Bắt đầu work order
  static async start(req, res) {
    try {
      const { id } = req.params;

      const workOrder = await WorkOrder.findByPk(id);
      if (!workOrder) {
        return res.status(404).json({
          success: false,
          message: 'Work order không tồn tại'
        });
      }

      if (workOrder.status !== 'pending') {
        return res.status(400).json({
          success: false,
          message: 'Chỉ có thể bắt đầu work order ở trạng thái pending'
        });
      }

      await workOrder.update({
        status: 'in_progress',
        actual_start: new Date()
      });

      res.json({
        success: true,
        message: 'Bắt đầu work order thành công',
        data: workOrder
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Hoàn thành work order
  static async complete(req, res) {
    const t = await sequelize.transaction();

    try {
      const { id } = req.params;
      const { completed_qty } = req.body;

      const workOrder = await WorkOrder.findByPk(id, {
        include: [{ model: ManufacturingOrderDetail }],
        transaction: t
      });

      if (!workOrder || workOrder.status !== 'in_progress') {
        throw new Error('INVALID_WORK_ORDER');
      }

      const requirements = await MaterialRequirement.findAll({
        where: { work_id: id },
        transaction: t
      });


      for (const req of requirements) {
        console.log('Export data:', {
          item_id: req.material_id,
          item_type: 'material',
          from_warehouse_id: 2,
          quantity: req.required_quantity,
          reference_id: id,
          reference_type: 'work_order',
          description: `Sản xuất work order ${workOrder.work_code}`,
          user_id: req.user?.user_id || 1
        });
        // Gọi exportGoods mà không dùng req/res, chỉ truyền data và transaction
        await exportGoodsLogic({
          item_id: req.material_id,
          item_type: 'material',
          from_warehouse_id: 2,
          quantity: req.required_quantity,
          reference_id: id,
          reference_type: 'work_order',
          description: `Sản xuất work order ${workOrder.work_code}`,
          user_id: req.user?.user_id || 1
        }, t);
      }

      const detail = workOrder.ManufacturingOrderDetail;
      await importGoodsLogic({
        item_id: detail.item_id,
        item_type: detail.item_type,
        to_warehouse_id: 2,
        quantity: completed_qty || workOrder.work_quantity,
        reference_id: id,
        reference_type: 'work_order',
        description: `Hoàn thành sản xuất work order ${workOrder.work_code}`,
        user_id: req.user?.user_id || 1
      }, t);
      // Trong method complete, sau khi importGoodsLogic và trước khi commit transaction
      await ManufacturingOrderDetail.update({
        produced_qty: sequelize.literal(`produced_qty + ${completed_qty || workOrder.work_quantity}`)
      }, {
        where: { detail_id: workOrder.detail_id },
        transaction: t
      });

      // Kiểm tra nếu đã hoàn thành đủ số lượng thì cập nhật status
      const updatedDetail = await ManufacturingOrderDetail.findByPk(workOrder.detail_id, { transaction: t });
      if (updatedDetail.produced_qty >= updatedDetail.quantity) {
        await updatedDetail.update({ status: 'completed' }, { transaction: t });
      }
      await workOrder.update({
        status: 'completed',
        actual_end: new Date(),
        completed_qty: completed_qty || workOrder.work_quantity
      }, { transaction: t });

      await t.commit();

      res.json({
        success: true,
        message: 'Hoàn thành sản xuất thành công',
        data: workOrder
      });
    } catch (error) {
      await t.rollback();

      if (error.message === 'INVALID_WORK_ORDER') {
        return res.status(400).json({ message: 'Work order không hợp lệ' });
      }

      res.status(500).json({ message: error.message || 'Lỗi server' });
    }
  }



  // Phân công work order
  static async assign(req, res) {
    try {
      const { id } = req.params;
      const { assigned_to, department } = req.body;

      const [updatedRows] = await WorkOrder.update(
        { assigned_to, department },
        { where: { work_id: id } }
      );

      if (updatedRows === 0) {
        return res.status(404).json({
          success: false,
          message: 'Work order không tồn tại'
        });
      }

      res.json({
        success: true,
        message: 'Phân công work order thành công'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Lấy work orders của user hiện tại
  static async getMyTasks(req, res) {
    try {
      const userId = req.user.user_id; // Assuming auth middleware sets req.user

      const workOrders = await WorkOrder.findAll({
        where: { assigned_to: userId },
        include: [
          { model: ManufacturingOrder, as: 'manufacturingOrder' },
          { model: ManufacturingOrderDetail, as: 'orderDetail' }
        ],
        order: [['priority', 'DESC'], ['planned_start', 'ASC']]
      });

      res.json({
        success: true,
        data: workOrders
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Thống kê work orders
  static async getStatistics(req, res) {
    try {
      const stats = await WorkOrder.findAll({
        attributes: [
          'status',
          [sequelize.fn('COUNT', sequelize.col('work_id')), 'count']
        ],
        group: ['status'],
        raw: true
      });

      const priorityStats = await WorkOrder.findAll({
        attributes: [
          'priority',
          [sequelize.fn('COUNT', sequelize.col('work_id')), 'count']
        ],
        group: ['priority'],
        raw: true
      });

      res.json({
        success: true,
        data: {
          byStatus: stats,
          byPriority: priorityStats
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Xóa work order
  static async delete(req, res) {
    try {
      const { id } = req.params;

      const workOrder = await WorkOrder.findByPk(id);
      if (!workOrder) {
        return res.status(404).json({
          success: false,
          message: 'Work order không tồn tại'
        });
      }

      if (workOrder.status === 'in_progress') {
        return res.status(400).json({
          success: false,
          message: 'Không thể xóa work order đang thực hiện'
        });
      }

      await workOrder.destroy();

      res.json({
        success: true,
        message: 'Xóa work order thành công'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }


  // Cập nhật method getMaterialStatus trong WorkOrderController

  static async getMaterialStatus(req, res) {
    try {
      const { id } = req.params; // work_id

      // 1. Lấy WorkOrder và detail
      const workOrder = await WorkOrder.findOne({
        where: { work_id: id },
        include: [{ model: ManufacturingOrderDetail }],
      });

      if (!workOrder || !workOrder.ManufacturingOrderDetail) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy WorkOrder hoặc detail.',
        });
      }

      const detail = workOrder.ManufacturingOrderDetail;
      if (detail.item_type !== 'product') {
        return res.status(400).json({
          success: false,
          message: 'WorkOrder không phải sản xuất sản phẩm hoàn chỉnh.',
        });
      }

      const productId = detail.item_id;

      // 2. Lấy BOM đang hoạt động cho sản phẩm
      const bom = await BOM.findOne({
        where: { product_id: productId },
        order: [['createdAt', 'DESC']],
      });

      if (!bom) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy BOM cho sản phẩm.',
        });
      }

      // 3. Lấy danh sách BOM items và nguyên vật liệu liên quan
      const bomItems = await BOMItem.findAll({
        where: { bom_id: bom.bom_id },
        include: [{
          model: Material,
          attributes: ['material_id', 'name', 'unit']
        }],
      });

      if (!bomItems.length) {
        return res.status(404).json({
          success: false,
          message: 'Không có item nào trong BOM.',
        });
      }

      const productionQty = parseFloat(workOrder.work_quantity);
      const materialIds = bomItems.map(item => item.material_id);

      // 4. Truy vấn tồn kho nguyên vật liệu tại kho 1 và kho 2
      const inventories = await MaterialInventory.findAll({
        where: {
          material_id: { [Op.in]: materialIds },
          warehouse_id: { [Op.in]: [1, 2] }
        }
      });

      // 5. Tạo mapping tồn kho: stockMap[warehouse_id][material_id] = quantity
      const stockMap = { 1: {}, 2: {} };
      inventories.forEach(inv => {
        const qty = parseFloat(inv.quantity);
        stockMap[inv.warehouse_id][inv.material_id] = qty;
      });

      // 6. Tạo danh sách nguyên vật liệu
      const materials = bomItems.map(item => {
        const requiredQty = productionQty * parseFloat(item.quantity);
        const stock1 = stockMap[1][item.material_id] || 0;
        const stock2 = stockMap[2][item.material_id] || 0;

        return {
          material_id: item.material_id,
          material_name: item.Material.name,
          unit: item.Material.unit,
          bom_quantity_per_unit: parseFloat(item.quantity),
          required_quantity: requiredQty,
          warehouse1_stock: stock1,
          production_stock: stock2,
          total_stock: stock1 + stock2
        };
      });

      // 7. Tạo MaterialRequirement nếu chưa tồn tại
      const existingRequirements = await MaterialRequirement.findAll({
        where: { work_id: workOrder.work_id }
      });

      if (existingRequirements.length === 0) {
        const requirements = materials.map(mat => ({
          work_id: workOrder.work_id,
          material_id: mat.material_id,
          required_quantity: mat.required_quantity
        }));
        await MaterialRequirement.bulkCreate(requirements);
      }

      // 8. Trả kết quả
      res.json({
        success: true,
        data: {
          workOrder: {
            work_id: workOrder.work_id,
            work_code: workOrder.work_code,
            production_quantity: productionQty
          },
          bom: {
            bom_id: bom.bom_id,
            product_id: bom.product_id,
            version: bom.version
          },
          materials,
          summary: {
            total_materials: materials.length,
            ready_in_production: materials.filter(m => m.production_stock >= m.required_quantity).length,
            ready_in_total: materials.filter(m => m.total_stock >= m.required_quantity).length,
            missing_materials: materials.filter(m => m.total_stock < m.required_quantity).length
          }
        }
      });
    } catch (err) {
      console.error('Lỗi getMaterialStatus:', err);
      res.status(500).json({
        success: false,
        message: 'Lỗi server.',
      });
    }
  }


  // Thêm vào workOrderController.js
  // static async checkMaterialAvailability(req, res) {
  //   try {
  //     const { id } = req.params; // work_id

  //     // Lấy material requirements
  //     const requirements = await MaterialRequirement.findAll({
  //       where: { work_id: id },
  //       include: [{ model: Material, attributes: ['name', 'unit'] }]
  //     });

  //     if (!requirements.length) {
  //       return res.status(404).json({ message: 'Chưa tạo material requirements' });
  //     }

  //     // Kiểm tra tồn kho
  //     const availabilityCheck = await Promise.all(
  //       requirements.map(async (req) => {
  //         const inventory = await MaterialInventory.findOne({
  //           where: {
  //             material_id: req.material_id,
  //             warehouse_id: 2
  //           }
  //         });

  //         return {
  //           material_id: req.material_id,
  //           material_name: req.Material.name,
  //           required_quantity: req.required_quantity,
  //           available_quantity: inventory ? inventory.quantity : 0,
  //           is_sufficient: inventory ? inventory.quantity >= req.required_quantity : false
  //         };
  //       })
  //     );

  //     const allSufficient = availabilityCheck.every(item => item.is_sufficient);

  //     res.json({
  //       work_id: id,
  //       is_ready: allSufficient,
  //       materials: availabilityCheck
  //     });

  //   } catch (error) {
  //     res.status(500).json({ message: error.message });
  //   }
  // }

}


module.exports = WorkOrderController;