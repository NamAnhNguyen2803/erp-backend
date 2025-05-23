'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      // Remove current_stock columns
      await queryInterface.removeColumn('products', 'current_stock', { transaction });
      await queryInterface.removeColumn('materials', 'current_stock', { transaction });
      await queryInterface.removeColumn('semi_finished_products', 'current_stock', { transaction });

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      // Add back current_stock columns
      await queryInterface.addColumn('products', 'current_stock', {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0
      }, { transaction });

      await queryInterface.addColumn('materials', 'current_stock', {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0
      }, { transaction });

      await queryInterface.addColumn('semi_finished_products', 'current_stock', {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0
      }, { transaction });

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
}; 