const { Product } = require('../models');
const { Op } = require('sequelize');
const BOM = require('../models/BOM');
const BOMItem = require('../models/BOMItem');
const Material = require('../models/Material');
const SemiProduct = require('../models/SemiFinishedProduct');

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

    const product = await Product.findByPk(product_id, {
      include: [
        {
          model: BOM,
          include: [BOMItem]
        }
      ]
    });

    if (!product) {
      return res.status(404).json({ message: 'Không tìm thấy sản phẩm' });
    }

    // Gắn thông tin reference vào từng BOMItem
    const bomItems = product.BOM?.BOMItems || [];

    const resolvedItems = await Promise.all(
      bomItems.map(async (item) => {
        let reference = null;

        if (item.item_type === 'material') {
          reference = await Material.findByPk(item.reference_id, {
            attributes: ['material_id', 'code', 'name', 'unit']
          });
        } else if (item.item_type === 'semi_product') {
          reference = await SemiProduct.findByPk(item.reference_id, {
            attributes: ['semi_product_id', 'code', 'name', 'unit']
          });
        }

        return {
          ...item.toJSON(),
          reference: reference ? reference.toJSON() : null
        };
      })
    );

    // Gắn lại BOMItem mới có reference vào BOM
    if (product.BOM) {
      product.BOM.BOMItems = resolvedItems;
    }

    return res.status(200).json({ success: true, data: product });

  } catch (error) {
    console.error('Lỗi khi lấy sản phẩm:', error);
    return res.status(500).json({ message: 'Lỗi máy chủ nội bộ' });
  }
};


// Tạo sản phẩm mới
exports.createProduct = async (req, res) => {
  try {
    const { code, name, unit, specification, unit_price, supplier, status } = req.body;

    const existingProduct = await Product.findOne({ where: { code } });

    if (existingProduct) {
      return res.status(400).json({ message: 'Mã sản phẩm đã tồn tại' });
    }

    const newProduct = await Product.create({
      code,
      name,
      unit,
      specification,
      min_stock: 0,
      max_stock: 0,
      unit_price,
      supplier,
      status
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
    const { code, name, unit, specification, min_stock, max_stock, unit_price, supplier, status } = req.body;

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
      code,
      name,
      unit,
      specification,
      min_stock,
      max_stock,
      unit_price,
      supplier,
      status
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
