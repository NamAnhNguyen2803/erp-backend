const { Product } = require('../models');
const { Op } = require('sequelize');

// Lấy tất cả sản phẩm với phân trang và bộ lọc
exports.getAllProducts = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, search } = req.query;
    const offset = (page - 1) * limit;

    const where = {};
    if (status) where.status = status;
    if (search) {
      where[Op.or] = [
        { code: { [Op.like]: `%${search}%` } },
        { name: { [Op.like]: `%${search}%` } },
        { specification: { [Op.like]: `%${search}%` } }
      ];
    }

    const { count, rows } = await Product.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset: parseInt(offset),
      attributes: ['product_id', 'code', 'name', 'unit', 'specification', 'status'],
      order: [['product_id', 'DESC']]
    });

    return res.status(200).json({
      products: rows,
      total: count,
      page: parseInt(page),
      limit: parseInt(limit)
    });
  } catch (error) {
    console.error('Lỗi khi lấy sản phẩm:', error);
    return res.status(500).json({ message: 'Lỗi máy chủ nội bộ' });
  }
};

// Lấy sản phẩm theo ID
exports.getProductById = async (req, res) => {
  try {
    const { product_id } = req.params;
    const product = await Product.findByPk(product_id);

    if (!product) {
      return res.status(404).json({ message: 'Không tìm thấy sản phẩm' });
    }

    return res.status(200).json(product);
  } catch (error) {
    console.error('Lỗi khi lấy sản phẩm:', error);
    return res.status(500).json({ message: 'Lỗi máy chủ nội bộ' });
  }
};

// Tạo sản phẩm mới
exports.createProduct = async (req, res) => {
  try {
    const { code, name, unit, specification } = req.body;

    const existingProduct = await Product.findOne({ where: { code } });
    if (existingProduct) {
      return res.status(400).json({ message: 'Mã sản phẩm đã tồn tại' });
    }

    const newProduct = await Product.create({
      code,
      name,
      unit,
      specification,
      min_stock,
      max_stock,// Initialize with 0 stock
      unit_price,
      supplier,
      status :'active' 
    });

    return res.status(201).json(newProduct);
  } catch (error) {
    console.error('Lỗi khi tạo sản phẩm:', error);
    return res.status(500).json({ message: 'Lỗi máy chủ nội bộ' });
  }
};

// Cập nhật sản phẩm
exports.updateProduct = async (req, res) => {
  try {
    const { product_id } = req.params;
    const { code, name, unit, specification } = req.body;

    const product = await Product.findByPk(product_id);
    if (!product) {
      return res.status(404).json({ message: 'Không tìm thấy sản phẩm' });
    }

    if (code && code !== product.code) {
      const existing = await Product.findOne({ where: { code } });
      if (existing) {
        return res.status(400).json({ message: 'Mã sản phẩm đã tồn tại' });
      }
    }

    await product.update({
      code: code || product.code,
      name: name || product.name,
      unit: unit || product.unit,
      specification: specification !== undefined ? specification : product.specification,
    });

    return res.status(200).json(product);
  } catch (error) {
    console.error('Lỗi khi cập nhật sản phẩm:', error);
    return res.status(500).json({ message: 'Lỗi máy chủ nội bộ' });
  }
};

// Xóa sản phẩm (xóa cứng)
exports.deleteProduct = async (req, res) => {
  try {
    const { product_id } = req.params;
    const product = await Product.findByPk(product_id);
    if (!product) {
      return res.status(404).json({ message: 'Không tìm thấy sản phẩm' });
    }

    await product.destroy();

    return res.status(200).json({ message: 'Sản phẩm đã được xóa' });
  } catch (error) {
    console.error('Lỗi khi xóa sản phẩm:', error);
    return res.status(500).json({ message: 'Lỗi máy chủ nội bộ' });
  }
};
