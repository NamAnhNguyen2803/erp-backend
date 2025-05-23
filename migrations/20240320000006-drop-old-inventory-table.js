'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Drop the old inventory table
    await queryInterface.dropTable('inventory');
  },

  down: async (queryInterface, Sequelize) => {
    // Recreate the old inventory table
    await queryInterface.createTable('inventory', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      item_id: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      item_type: {
        type: Sequelize.ENUM('product', 'material', 'semi_product'),
        allowNull: false
      },
      quantity: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0
      },
      unit: {
        type: Sequelize.STRING(20),
        allowNull: false
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    await queryInterface.addIndex('inventory', ['item_id', 'item_type']);
  }
}; 