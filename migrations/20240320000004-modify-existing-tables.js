'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Add new columns to warehouses table
    await queryInterface.addColumn('warehouses', 'code', {
      type: Sequelize.STRING(10),
      allowNull: false,
      unique: true
    });

    await queryInterface.addColumn('warehouses', 'warehouse_type', {
      type: Sequelize.STRING(30),
      allowNull: false,
      defaultValue: 'general'
    });

    // Remove current_stock columns
    await queryInterface.removeColumn('products', 'current_stock');
    await queryInterface.removeColumn('materials', 'current_stock');
    await queryInterface.removeColumn('semi_finished_products', 'current_stock');

    // Modify inventory_transactions table
    await queryInterface.addColumn('inventory_transactions', 'reference_type', {
      type: Sequelize.STRING(20),
      allowNull: true,
      comment: 'Type of reference document (e.g., purchase_order, sales_order, production_order)'
    });

    // Modify transaction_type enum
    await queryInterface.changeColumn('inventory_transactions', 'transaction_type', {
      type: Sequelize.ENUM('stock_in', 'stock_out', 'transfer_in', 'transfer_out', 'consume', 'produce'),
      allowNull: false
    });

    // Rename material_id to item_id and add item_type
    await queryInterface.renameColumn('inventory_transactions', 'material_id', 'item_id');
    
    await queryInterface.addColumn('inventory_transactions', 'item_type', {
      type: Sequelize.ENUM('material', 'product', 'semi_product'),
      allowNull: false,
      defaultValue: 'material'
    });

    // Add foreign key constraints
    await queryInterface.addConstraint('inventory_transactions', {
      fields: ['item_id', 'item_type'],
      type: 'foreign key',
      name: 'inventory_transactions_item_fk',
      references: {
        table: 'products',
        field: 'id'
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    });

    await queryInterface.addConstraint('inventory_transactions', {
      fields: ['warehouse_id'],
      type: 'foreign key',
      name: 'inventory_transactions_warehouse_fk',
      references: {
        table: 'warehouses',
        field: 'id'
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    });

    // Add indexes
    await queryInterface.addIndex('inventory_transactions', ['item_id', 'item_type'], {
      name: 'inventory_transactions_item_idx'
    });

    await queryInterface.addIndex('inventory_transactions', ['warehouse_id'], {
      name: 'inventory_transactions_warehouse_idx'
    });

    await queryInterface.addIndex('inventory_transactions', ['transaction_type'], {
      name: 'inventory_transactions_type_idx'
    });

    await queryInterface.addIndex('inventory_transactions', ['reference_type', 'reference_id'], {
      name: 'inventory_transactions_reference_idx'
    });
  },

  down: async (queryInterface, Sequelize) => {
    // Remove foreign key constraints
    await queryInterface.removeConstraint('inventory_transactions', 'inventory_transactions_item_fk');
    await queryInterface.removeConstraint('inventory_transactions', 'inventory_transactions_warehouse_fk');

    // Remove indexes
    await queryInterface.removeIndex('inventory_transactions', 'inventory_transactions_item_idx');
    await queryInterface.removeIndex('inventory_transactions', 'inventory_transactions_warehouse_idx');
    await queryInterface.removeIndex('inventory_transactions', 'inventory_transactions_type_idx');
    await queryInterface.removeIndex('inventory_transactions', 'inventory_transactions_reference_idx');

    // Revert column changes
    await queryInterface.removeColumn('inventory_transactions', 'reference_type');
    await queryInterface.removeColumn('inventory_transactions', 'item_type');
    await queryInterface.renameColumn('inventory_transactions', 'item_id', 'material_id');

    // Revert transaction_type enum
    await queryInterface.changeColumn('inventory_transactions', 'transaction_type', {
      type: Sequelize.ENUM('stock_in', 'stock_out', 'transfer'),
      allowNull: false
    });

    // Add back current_stock columns
    await queryInterface.addColumn('products', 'current_stock', {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0
    });

    await queryInterface.addColumn('materials', 'current_stock', {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0
    });

    await queryInterface.addColumn('semi_finished_products', 'current_stock', {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0
    });

    // Remove warehouse columns
    await queryInterface.removeColumn('warehouses', 'code');
    await queryInterface.removeColumn('warehouses', 'warehouse_type');
  }
}; 