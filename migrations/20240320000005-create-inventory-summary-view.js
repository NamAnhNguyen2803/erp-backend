'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.query(`
      CREATE OR REPLACE VIEW inventory_summary AS
      SELECT 
        'product' as item_type,
        p.id as item_id,
        p.name as item_name,
        p.code as item_code,
        w.id as warehouse_id,
        w.name as warehouse_name,
        w.code as warehouse_code,
        w.warehouse_type,
        pi.quantity,
        pi.unit,
        p.min_stock_level,
        p.max_stock_level,
        CASE 
          WHEN pi.quantity <= p.min_stock_level THEN 'low'
          WHEN pi.quantity >= p.max_stock_level THEN 'high'
          ELSE 'normal'
        END as stock_status
      FROM products p
      LEFT JOIN product_inventory pi ON p.id = pi.product_id
      LEFT JOIN warehouses w ON pi.warehouse_id = w.id
      
      UNION ALL
      
      SELECT 
        'material' as item_type,
        m.id as item_id,
        m.name as item_name,
        m.code as item_code,
        w.id as warehouse_id,
        w.name as warehouse_name,
        w.code as warehouse_code,
        w.warehouse_type,
        mi.quantity,
        mi.unit,
        m.min_stock_level,
        m.max_stock_level,
        CASE 
          WHEN mi.quantity <= m.min_stock_level THEN 'low'
          WHEN mi.quantity >= m.max_stock_level THEN 'high'
          ELSE 'normal'
        END as stock_status
      FROM materials m
      LEFT JOIN material_inventory mi ON m.id = mi.material_id
      LEFT JOIN warehouses w ON mi.warehouse_id = w.id
      
      UNION ALL
      
      SELECT 
        'semi_product' as item_type,
        sp.id as item_id,
        sp.name as item_name,
        sp.code as item_code,
        w.id as warehouse_id,
        w.name as warehouse_name,
        w.code as warehouse_code,
        w.warehouse_type,
        spi.quantity,
        spi.unit,
        sp.min_stock_level,
        sp.max_stock_level,
        CASE 
          WHEN spi.quantity <= sp.min_stock_level THEN 'low'
          WHEN spi.quantity >= sp.max_stock_level THEN 'high'
          ELSE 'normal'
        END as stock_status
      FROM semi_finished_products sp
      LEFT JOIN semi_product_inventory spi ON sp.id = spi.semi_product_id
      LEFT JOIN warehouses w ON spi.warehouse_id = w.id;
    `);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.query('DROP VIEW IF EXISTS inventory_summary;');
  }
}; 