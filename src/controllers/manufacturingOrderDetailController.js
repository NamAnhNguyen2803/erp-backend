const ManufacturingOrderDetail = require('../models/ManufacturingOrderDetail');
const ManufacturingOrder = require('../models/ManufacturingOrder');
const BOM = require('../models/BOM');
const SemiBOM = require('../models/SemiBom');
const Material = require('../models/Material');
const SemiFinished = require('../models/SemiFinishedProduct');
const Product = require('../models/Product');
const { attachItemNames } = require('../helper/inventoryHelper');

class ManufacturingOrderDetailController {
  // Lấy tất cả details của một manufacturing order
static async getByOrderId(req, res) {
  try {
    const { order_id } = req.params;

    const details = await ManufacturingOrderDetail.findAll({
      where: { order_id },
      order: [['created_at', 'ASC']]
    });

    // Lấy item info cho từng detail
    const enrichedDetails = await Promise.all(details.map(async detail => {
      let itemInfo = null;
      switch(detail.item_type) {
        case 'material':
          itemInfo = await Material.findByPk(detail.item_id);
          break;
        case 'product':
          itemInfo = await Product.findByPk(detail.item_id);
          break;
        case 'semi_finished':
          itemInfo = await SemiFinished.findByPk(detail.item_id);
          break;
        default:
          itemInfo = null;
      }

      return {
        ...detail.toJSON(),
        item_info: itemInfo ? itemInfo.toJSON() : null
      };
    }));

    res.json({
      success: true,
      data: enrichedDetails
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
}

  // Tạo detail mới create or update quantity if exists
static async create(req, res) {
  try {
    const {
      order_id,
      item_id,
      item_type,
      quantity,
      specification,
      planned_start,
      planned_end,
      priority,
      notes,
      created_by
    } = req.body;

    const order = await ManufacturingOrder.findByPk(order_id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Manufacturing order không tồn tại' });
    }

    // Tìm xem item đã có trong order chưa
    let detail = await ManufacturingOrderDetail.findOne({
      where: { order_id, item_id }
    });

    if (detail) {
      // Nếu có, cộng dồn quantity
        detail.quantity = parseFloat(detail.quantity) + parseFloat(quantity);
      await detail.save();
    } else {
      // Nếu chưa, tạo mới
      detail = await ManufacturingOrderDetail.create({
        order_id,
        item_id,
        item_type,
        quantity: parseFloat(quantity),
        specification,
        planned_start,
        planned_end,
        priority,
        notes,
        created_by
      });
    }

    res.status(201).json({ success: true, data: detail });
  } catch (error) {
    console.error('Create ManufacturingOrderDetail error:', error);
    res.status(500).json({ success: false, message: error.message || 'Internal server error' });
  }
}

  // Cập nhật detail
  static async update(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const [updatedRows] = await ManufacturingOrderDetail.update(updateData, {
        where: { detail_id: id }
      });

      if (updatedRows === 0) {
        return res.status(404).json({
          success: false,
          message: 'Detail không tồn tại'
        });
      }

      const updatedDetail = await ManufacturingOrderDetail.findByPk(id);
      res.json({
        success: true,
        data: updatedDetail
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Cập nhật trạng thái
  static async updateStatus(req, res) {
    try {
      const { id } = req.params;
      const { status } = req.body;

      const [updatedRows] = await ManufacturingOrderDetail.update(
        { status },
        { where: { detail_id: id } }
      );

      if (updatedRows === 0) {
        return res.status(404).json({
          success: false,
          message: 'Detail không tồn tại'
        });
      }

      res.json({
        success: true,
        message: 'Cập nhật trạng thái thành công'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Cập nhật số lượng đã sản xuất
  static async updateProducedQuantity(req, res) {
    try {
      const { id } = req.params;
      const { produced_qty } = req.body;

      const detail = await ManufacturingOrderDetail.findByPk(id);
      if (!detail) {
        return res.status(404).json({
          success: false,
          message: 'Detail không tồn tại'
        });
      }

      if (produced_qty > detail.quantity) {
        return res.status(400).json({
          success: false,
          message: 'Số lượng sản xuất không thể vượt quá số lượng yêu cầu'
        });
      }

      await detail.update({ produced_qty });

      // Tự động cập nhật trạng thái
      const newStatus = produced_qty >= detail.quantity ? 'completed' : 'in_progress';
      if (detail.status !== newStatus) {
        await detail.update({ status: newStatus });
      }

      res.json({
        success: true,
        data: detail
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Xóa detail
  static async delete(req, res) {
    try {
      const { id } = req.params;

      const deletedRows = await ManufacturingOrderDetail.destroy({
        where: { detail_id: id }
      });

      if (deletedRows === 0) {
        return res.status(404).json({
          success: false,
          message: 'Detail không tồn tại'
        });
      }

      res.json({
        success: true,
        message: 'Xóa detail thành công'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
}

module.exports = ManufacturingOrderDetailController;