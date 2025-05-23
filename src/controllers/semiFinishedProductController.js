const SemiFinishedProduct = require('../models/SemiFinishedProduct'); // Đảm bảo đường dẫn đúng
const { Op } = require('sequelize');

// Lấy tất cả sản phẩm bán thành phẩm với phân trang và bộ lọc
exports.getAllSemiFinishedProducts = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, search } = req.query; // Thêm status và search nếu bạn muốn lọc/tìm kiếm theo trạng thái/tên/mã
    const offset = (page - 1) * limit;

    // Xây dựng điều kiện lọc
    const where = {};
    if (status) where.status = status; // Lọc theo status nếu có trong model và bạn muốn dùng

    if (search) {
      where[Op.or] = [
        { code: { [Op.like]: `%${search}%` } },
        { name: { [Op.like]: `%${search}%` } },
        { specification: { [Op.like]: `%${search}%` } } // Thêm tìm kiếm theo specification
      ];
    }

    // Tìm sản phẩm bán thành phẩm với phân trang
    const { count, rows } = await SemiFinishedProduct.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset: parseInt(offset),
      // Loại bỏ 'phase' khỏi danh sách attributes
      attributes: ['semi_product_id', 'code', 'name', 'unit', 'specification',  'status'], // Đảm bảo các trường này có trong model của bạn
      order: [['semi_product_id', 'DESC']]
    });

    return res.status(200).json({
      semiProducts: rows,
      total: count,
      page: parseInt(page),
      limit: parseInt(limit)
    });
  } catch (error) {
    console.error('Lỗi khi lấy sản phẩm bán thành phẩm:', error);
    return res.status(500).json({ message: 'Lỗi máy chủ nội bộ' });
  }
};

// Lấy sản phẩm bán thành phẩm theo ID
exports.getSemiFinishedProductById = async (req, res) => {
  try {
    const { semi_product_id } = req.params;
    const semiProduct = await SemiFinishedProduct.findByPk(semi_product_id);

    if (!semiProduct) {
      return res.status(404).json({ message: 'Không tìm thấy sản phẩm bán thành phẩm' });
    }

    return res.status(200).json(semiProduct);
  } catch (error) {
    console.error('Lỗi khi lấy sản phẩm bán thành phẩm:', error);
    return res.status(500).json({ message: 'Lỗi máy chủ nội bộ' });
  }
};

// Tạo sản phẩm bán thành phẩm mới
exports.createSemiFinishedProduct = async (req, res) => {
  try {
    // Loại bỏ 'phase' khỏi req.body
    const { code, name, unit, specification } = req.body;

    // Kiểm tra nếu code đã tồn tại
    const existingSemiProduct = await SemiFinishedProduct.findOne({ where: { code } });
    if (existingSemiProduct) {
      return res.status(400).json({ message: 'Mã sản phẩm bán thành phẩm đã tồn tại' });
    }

    // Tạo sản phẩm bán thành phẩm mới
    const newSemiProduct = await SemiFinishedProduct.create({
      code,
      name,
      unit,
      specification,
    });

    return res.status(201).json(newSemiProduct);
  } catch (error) {
    console.error('Lỗi khi tạo sản phẩm bán thành phẩm:', error);
    return res.status(500).json({ message: 'Lỗi máy chủ nội bộ' });
  }
};

// Cập nhật sản phẩm bán thành phẩm
exports.updateSemiFinishedProduct = async (req, res) => {
  try {
    const { semi_product_id } = req.params;
    // Loại bỏ 'phase' khỏi req.body
    const { code, name, unit, specification } = req.body;

    // Tìm sản phẩm bán thành phẩm theo ID
    const semiProduct = await SemiFinishedProduct.findByPk(semi_product_id);
    if (!semiProduct) {
      return res.status(404).json({ message: 'Không tìm thấy sản phẩm bán thành phẩm' });
    }

    // Kiểm tra nếu cập nhật code và nếu nó đã tồn tại
    if (code && code !== semiProduct.code) {
      const existingSemiProduct = await SemiFinishedProduct.findOne({ where: { code } });
      if (existingSemiProduct) {
        return res.status(400).json({ message: 'Mã sản phẩm bán thành phẩm đã tồn tại' });
      }
    }

    // Cập nhật các trường của sản phẩm bán thành phẩm
    await semiProduct.update({
      code: code || semiProduct.code,
      name: name || semiProduct.name,
      unit: unit || semiProduct.unit,
      specification: specification !== undefined ? specification : semiProduct.specification,
      // Loại bỏ 'phase' khỏi đây
    });

    return res.status(200).json(semiProduct);
  } catch (error) {
    console.error('Lỗi khi cập nhật sản phẩm bán thành phẩm:', error);
    return res.status(500).json({ message: 'Lỗi máy chủ nội bộ' });
  }
};

// Xóa sản phẩm bán thành phẩm (xóa cứng)
exports.deleteSemiFinishedProduct = async (req, res) => {
  try {
    const { semi_product_id } = req.params;

    // Tìm sản phẩm bán thành phẩm theo ID
    const semiProduct = await SemiFinishedProduct.findByPk(semi_product_id);
    if (!semiProduct) {
      return res.status(404).json({ message: 'Không tìm thấy sản phẩm bán thành phẩm' });
    }

    // Xóa sản phẩm bán thành phẩm (xóa cứng)
    await semiProduct.destroy();

    return res.status(200).json({ message: 'Sản phẩm bán thành phẩm đã được xóa' });
  } catch (error) {
    console.error('Lỗi khi xóa sản phẩm bán thành phẩm:', error);
    return res.status(500).json({ message: 'Lỗi máy chủ nội bộ' });
  }
};