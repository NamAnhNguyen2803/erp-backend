'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      // Get all records from old inventory table
      const oldInventory = await queryInterface.sequelize.query(
        'SELECT * FROM inventory',
        {
          type: queryInterface.sequelize.QueryTypes.SELECT,
          transaction
        }
      );

      // Migrate data to new tables based on item_type
      for (const record of oldInventory) {
        const { item_id, item_type, quantity, unit, warehouse_id } = record;

        // Skip if warehouse_id is null
        if (!warehouse_id) {
          console.warn(`Skipping record ${record.id}: warehouse_id is null`);
          continue;
        }

        // Map to appropriate table and fields
        let targetTable, idField;
        switch (item_type) {
          case 'product':
            targetTable = 'product_inventory';
            idField = 'product_id';
            break;
          case 'material':
            targetTable = 'material_inventory';
            idField = 'material_id';
            break;
          case 'semi_product':
            targetTable = 'semi_product_inventory';
            idField = 'semi_product_id';
            break;
          default:
            console.warn(`Skipping record ${record.id}: invalid item_type ${item_type}`);
            continue;
        }

        // Insert into new table
        await queryInterface.bulkInsert(targetTable, [{
          [idField]: item_id,
          warehouse_id,
          quantity,
          unit,
          created_at: record.created_at || new Date(),
          updated_at: record.updated_at || new Date()
        }], { transaction });

        // Create corresponding transaction record
        await queryInterface.bulkInsert('inventory_transactions', [{
          item_id,
          item_type,
          warehouse_id,
          quantity,
          transaction_type: 'stock_in',
          reference_type: 'migration',
          reference_id: record.id,
          notes: 'Migrated from old inventory table',
          created_at: record.created_at || new Date(),
          updated_at: record.updated_at || new Date()
        }], { transaction });
      }

      // Validate data migration
      const validationQueries = [
        'SELECT COUNT(*) as count FROM inventory',
        'SELECT COUNT(*) as count FROM product_inventory',
        'SELECT COUNT(*) as count FROM material_inventory',
        'SELECT COUNT(*) as count FROM semi_product_inventory'
      ];

      const [oldCount, productCount, materialCount, semiProductCount] = await Promise.all(
        validationQueries.map(query => 
          queryInterface.sequelize.query(query, {
            type: queryInterface.sequelize.QueryTypes.SELECT,
            transaction
          })
        )
      );

      console.log('Migration validation:');
      console.log(`Old inventory records: ${oldCount[0].count}`);
      console.log(`New product inventory records: ${productCount[0].count}`);
      console.log(`New material inventory records: ${materialCount[0].count}`);
      console.log(`New semi-product inventory records: ${semiProductCount[0].count}`);

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      // Delete migrated data from new tables
      await queryInterface.bulkDelete('product_inventory', null, { transaction });
      await queryInterface.bulkDelete('material_inventory', null, { transaction });
      await queryInterface.bulkDelete('semi_product_inventory', null, { transaction });
      await queryInterface.bulkDelete('inventory_transactions', {
        reference_type: 'migration'
      }, { transaction });

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
}; 