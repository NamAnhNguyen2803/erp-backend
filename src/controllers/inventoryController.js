const {
  ProductInventory,
  MaterialInventory,
  SemiProductInventory,
  Product,
  Material,
  SemiFinishedProduct,
  Warehouse
} = require('../models');

exports.getAllInventory = async (req, res) => {
  try {
    const [products, materials, semiProducts] = await Promise.all([
      ProductInventory.findAll({
        include: [
          { model: Product, as: 'Product' },
          { model: Warehouse, as: 'Warehouse' }
        ]
      }),
      MaterialInventory.findAll({
        include: [
          { model: Material, as: 'Material' },     // Kiểm tra alias tương tự cho Material
          { model: Warehouse, as: 'Warehouse' }
        ]
      }),
      SemiProductInventory.findAll({
        include: [
          { model: SemiFinishedProduct, as: 'SemiFinishedProduct' } // Tương tự, cần kiểm alias
        ]
      }),
    ]);
    res.json({ products, materials, semiProducts });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

  
// Tồn kho theo loại: Nguyên vật liệu
exports.getInventoryByMaterial = async (req, res) => {
  try {
    const materials = await MaterialInventory.findAll({
      include: [
        { model: Material },     
        { model: Warehouse }
      ]
    });
    res.json(materials);
  } catch (err) {
    console.log(MaterialInventory.associations);
    console.error('Error getting Material:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// Tồn kho theo loại: Thành phẩm
exports.getInventoryByProduct = async (req, res) => {
  try {
    const products = await ProductInventory.findAll({
      include: [
        { model: Product}, 
        { model: Warehouse}
      ]
    });
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Tồn kho theo loại: Bán thành phẩm
exports.getInventoryBySemiProduct = async (req, res) => {
  try {
    const semiProducts = await SemiProductInventory.findAll({
      include: [
        { model: SemiFinishedProduct},
        { model: Warehouse, as: 'Warehouse' }
      ]
    });
    res.json(semiProducts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Lấy tồn kho theo warehouse cụ thể (gộp cả 3 loại)
exports.getInventoryByWarehouse = async (req, res) => {
  const { warehouseId } = req.params;
  try {
    const [products, materials, semiProducts] = await Promise.all([
      ProductInventory.findAll({
        where: { warehouse_id: warehouseId },
        include: [
          { model: Product},
          { model: Warehouse }
        ]
      }),
      MaterialInventory.findAll({
        where: { warehouse_id: warehouseId },
        include: [
          { model: Material},
          { model: Warehouse }
        ]
      }),
      SemiProductInventory.findAll({
        where: { warehouse_id: warehouseId },
        include: [
          { model: SemiFinishedProduct},
          { model: Warehouse}
        ]
      }),
    ]);
    res.json({materials,semiProducts, products  });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};