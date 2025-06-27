const { ManufacturingOrder, ManufacturingPlan,ManufacturingOrderDetail,WorkOrder , User } = require('../models');
const { Op } = require('sequelize');
const sequelize = require('../config/database');
const { inventoryHelper } = require('../helper/inventoryHelper');
// Get all manufacturing orders with pagination and filters
exports.getAllManufacturingOrders = async (req, res) => {
  try {
    const { page = 1, limit = 10, plan_id, status } = req.query;
    const offset = (page - 1) * limit;
    
    // Build filter condition
    const where = {};
    if (plan_id) where.plan_id = plan_id;
    if (status) where.status = status;
    
    // Find manufacturing orders with pagination
    const { count, rows } = await ManufacturingOrder.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset: parseInt(offset),
      include: [
        {
          model: ManufacturingPlan,
          attributes: ['plan_id', 'plan_code', 'status']
        },
        {
          model: User,
          attributes: ['user_id', 'username']
        }
      ],
      order: [['order_id', 'DESC']]
    });
    
    return res.status(200).json({
      orders: rows,
      total: count,
      page: parseInt(page),
      limit: parseInt(limit)
    });
  } catch (error) {
    console.error('Error getting manufacturing orders:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// Get manufacturing order by ID
exports.getManufacturingOrderById = async (req, res) => {
  try {
    const { order_id } = req.params;

    const order = await ManufacturingOrder.findByPk(order_id, {
      include: [
        {
          model: User,
          attributes: ['user_id', 'username']
        },
        {
          model: ManufacturingOrderDetail,
          attributes: ['detail_id', 'item_id', 'item_type', 'quantity','produced_qty', 'specification', 'planned_start', 'planned_end', 'priority', 'notes'],
        }
      ]
    });

    if (!order) {
      return res.status(404).json({ message: 'manufacturing order not found' });
    }

    // Chuyển dữ liệu detail sang JSON, rồi thêm tên sản phẩm
    const detailsWithNames = await inventoryHelper(order.ManufacturingOrderDetails || []);

    // Chuyển order sang JSON, gán lại detail đã đính kèm item_name
    const orderJson = order.toJSON();
    orderJson.ManufacturingOrderDetails = detailsWithNames;

    return res.status(200).json(orderJson);
  } catch (error) {
    console.error('Error getting manufacturing order:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};


// Create new manufacturing order
exports.createManufacturingOrder = async (req, res) => {
  // Transaction to ensure data consistency
  const t = await sequelize.transaction();
  
  try {
    const { order_code, plan_id,  start_date, end_date, status, created_by } = req.body;
    
    // Validate plan_id if provided
    if (plan_id) {
      const plan = await ManufacturingPlan.findByPk(plan_id);
      if (!plan) {
        await t.rollback();
        return res.status(400).json({ message: 'Invalid plan_id' });
      }
    }
    
    // Validate user_id (created_by)
    const user = await User.findByPk(created_by);
    if (!user) {
      await t.rollback();
      return res.status(400).json({ message: 'Invalid created_by user_id' });
    }
    
    // Check if order_code already exists
    const existingOrder = await ManufacturingOrder.findOne({
      where: { order_code }
    });
    
    if (existingOrder) {
      await t.rollback();
      return res.status(400).json({ message: 'Order number already exists' });
    }
    
    // Create new manufacturing order
    const newOrder = await ManufacturingOrder.create({
      order_code,
      plan_id,
      start_date: start_date ? new Date(start_date) : null,
      end_date: end_date ? new Date(end_date) : null,
      status,
      created_by,
      created_at: new Date()
    }, { transaction: t });
    
    await t.commit();
    
    // Get the created order with details
    const createdOrder = await ManufacturingOrder.findByPk(newOrder.order_id, {
      include: [
        {
          model: ManufacturingPlan,
          attributes: ['plan_id', 'plan_code', 'status']
        },
        {
          model: User,
          attributes: ['user_id', 'username']
        }
      ]
    });
    
    return res.status(201).json(createdOrder);
  } catch (error) {
    await t.rollback();
    console.error('Error creating manufacturing order:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// Update manufacturing order

exports.updateManufacturingOrder = async (req, res) => {
  const t = await sequelize.transaction();

  try {
    const { order_id } = req.params;
    const { start_date, end_date, status, details } = req.body;

    // 1. Lấy order gốc
    const order = await ManufacturingOrder.findByPk(order_id, { transaction: t });
    if (!order) {
      await t.rollback();
      return res.status(404).json({ message: 'Manufacturing order not found' });
    }

    // 2. Cập nhật thông tin cơ bản order
    await order.update({
      start_date: start_date ? new Date(start_date) : order.start_date,
      end_date: end_date ? new Date(end_date) : order.end_date,
      status: status || order.status,
    }, { transaction: t });

    if (Array.isArray(details)) {
      // 3. Lấy danh sách chi tiết hiện có
      const existingDetails = await ManufacturingOrderDetail.findAll({
        where: { order_id },
        transaction: t,
      });

      const existingIds = existingDetails.map(d => d.detail_id);
      const incomingIds = details.map(d => d.detail_id).filter(id => id);

      // 4. Xóa chi tiết bị loại bỏ
      const toDelete = existingIds.filter(id => !incomingIds.includes(id));
      if (toDelete.length) {
        await WorkOrder.destroy({
          where: { order_detail_id: toDelete },
          transaction: t,
        });
        await ManufacturingOrderDetail.destroy({
          where: { detail_id: toDelete },
          transaction: t,
        });
      }

      // 5. Thêm mới hoặc cập nhật chi tiết
      for (const detail of details) {
        if (detail.detail_id && existingIds.includes(detail.detail_id)) {
          // Cập nhật detail
          await ManufacturingOrderDetail.update({
            product_id: detail.product_id,
            quantity: detail.quantity,
            start_date: detail.start_date ? new Date(detail.start_date) : null,
            end_date: detail.end_date ? new Date(detail.end_date) : null,
            status: detail.status || 'pending',
          }, {
            where: { detail_id: detail.detail_id },
            transaction: t,
          });
        } else {
          // Thêm mới detail
          await ManufacturingOrderDetail.create({
            order_id,
            product_id: detail.product_id,
            quantity: detail.quantity,
            start_date: detail.start_date ? new Date(detail.start_date) : null,
            end_date: detail.end_date ? new Date(detail.end_date) : null,
            status: detail.status || 'pending',
          }, { transaction: t });
        }
      }
    }

    await t.commit();

    // 6. Trả về order kèm chi tiết, kèm user tạo order
    const updatedOrder = await ManufacturingOrder.findByPk(order_id, {
      include: [
        {
          model: ManufacturingOrderDetail,
          attributes: ['detail_id', 'order_id', 'product_id', 'quantity', 'start_date', 'end_date', 'status'],
        },
        {
          model: User,
          attributes: ['user_id', 'username'],
        },
      ],
    });

    return res.status(200).json(updatedOrder);
  } catch (error) {
    if (!t.finished) await t.rollback();
    console.error('Error updating manufacturing order:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

exports.approveManufacturingOrder =async (req, res) => {
  const { order_id } = req.params;

  try {
    // Tìm MO theo ID
    const mo = await ManufacturingOrder.findByPk(order_id);
    if (!mo) {
      return res.status(404).json({ message: 'Manufacturing Order not found' });
    }

    // Kiểm tra trạng thái hiện tại
    if (mo.status !== 'pending') {
      return res.status(400).json({ message: `Cannot approve MO with status '${mo.status}'. Only 'pending' allowed.` });
    }

    // Chuyển trạng thái sang approved
    mo.status = 'approved';
    await mo.save();

    return res.status(200).json({ message: 'Manufacturing Order approved successfully', order: mo });
  } catch (error) {
    console.error('Error approving Manufacturing Order:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}