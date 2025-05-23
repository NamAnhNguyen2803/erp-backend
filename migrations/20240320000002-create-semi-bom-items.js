'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('semi_BOM_items', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      semi_bom_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'semi_BOMs',
          key: 'id'
        }
      },
      item_id: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      item_type: {
        type: Sequelize.ENUM('material', 'semi_product'),
        allowNull: false
      },
      quantity: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false
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

    await queryInterface.addIndex('semi_BOM_items', ['semi_bom_id']);
    await queryInterface.addIndex('semi_BOM_items', ['item_id', 'item_type']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('semi_BOM_items');
  }
}; 