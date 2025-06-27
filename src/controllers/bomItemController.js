const { BOMItem } = require('../models');
// Trong createBomItem controller
exports.createBomItem = async (req, res) => {
  try {
    const { bom_id, reference_id, quantity, item_type } = req.body;

    // Kiểm tra xem BOM item đã tồn tại chưa (chỉ check nếu là nguyên vật liệu)
    const existingItem = await BOMItem.findOne({
      where: {
        bom_id,
        reference_id,
        item_type,
      },
    });

    if (existingItem) {
      // Nếu đã có → cộng dồn số lượng
   existingItem.quantity = (parseFloat(existingItem.quantity) + parseFloat(quantity)).toFixed(2);



      await existingItem.save();

      return res.json({
        success: true,
        message: 'Đã cộng dồn số lượng vào BOM item đã tồn tại.',
        data: existingItem,
      });
    }

    // Nếu chưa có → tạo mới
    const newItem = await BOMItem.create({
      bom_id,
      reference_id,
      quantity,
      item_type,
    });

    return res.json({
      success: true,
      message: 'Đã tạo BOM item mới.',
      data: newItem,
    });
  } catch (error) {
    console.error('Lỗi createBomItem:', error);
    res.status(500).json({ success: false, message: 'Lỗi server.' });
  }
};

exports.getBOMItems = async (req, res) => {
  try {
    const bomItems = await BOMItem.findAll();
    res.status(200).json(bomItems);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.updateBOMItem = async (req, res) => {
  try {
    const { item_id } = req.params;
    const {
      bom_id,
      item_type,
      reference_id,
      bom_level,
      reference,
      quantity,
      waste_percent,
      notes
    } = req.body;

    const bomItem = await BOMItem.findByPk(item_id);
    if (!bomItem) {
      return res.status(404).json({ error: 'BOMItem not found' });
    }

    if (!['material', 'semi_product'].includes(item_type)) {
      return res.status(400).json({ error: 'Invalid item_type' });
    }

    await bomItem.update({
      bom_id,
      item_type,
      reference_id,
      bom_level,
      reference,
      quantity,
      waste_percent,
      notes
    });

    res.status(200).json(bomItem);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.deleteBOMItem = async (req, res) => {
  try {
    const { item_id } = req.params;
    const bomItem = await BOMItem.findByPk(item_id);
    if (!bomItem) {
      return res.status(404).json({ error: 'BOMItem not found' });
    }

    await bomItem.destroy();
    res.status(200).json({ message: 'BOMItem deleted successfully' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
