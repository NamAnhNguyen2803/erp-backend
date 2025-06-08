const { Material, Product, SemiFinishedProduct } = require('../models');

async function inventoryHelper(transactions) {
  const itemIdMap = {
    material: new Set(),
    product: new Set(),
    semi_finished_product: new Set(),
  };

  // Gom ID theo item_type
  for (const txn of transactions) {
    const { item_type, item_id } = txn;
    if (itemIdMap[item_type]) {
      itemIdMap[item_type].add(item_id);
    }
  }

  // Truy vấn tất cả item theo loại
  const [materials, products, semis] = await Promise.all([
    Material.findAll({ where: { material_id: [...itemIdMap.material] } }),
    Product.findAll({ where: { product_id: [...itemIdMap.product] } }),
    SemiFinishedProduct.findAll({ where: { semi_product_id: [...itemIdMap.semi_finished_product] } }),
  ]);

  // Map ID -> name
  const nameMaps = {
    material: Object.fromEntries(materials.map(i => [i.material_id, i.name])),
    product: Object.fromEntries(products.map(i => [i.product_id, i.name])),
    semi_finished_product: Object.fromEntries(semis.map(i => [i.semi_product_id, i.name])),
  };

  // Gắn tên
  return transactions.map(txn => {
    const t = txn.toJSON ? txn.toJSON() : { ...txn };
    const { item_type, item_id } = t;
    t.item_name = nameMaps[item_type]?.[item_id] || null;
    return t;
  });
}
async function findItemByType(type, id) {
  switch (type) {
    case 'material':
      return await Material.findByPk(id);
    case 'product':
      return await Product.findByPk(id);
    case 'semi_finished_product':
      return await SemiFinishedProduct.findByPk(id);
    default:
      throw new Error(`Unknown item type: ${type}`);
  }
}
module.exports = { inventoryHelper,  findItemByType };
