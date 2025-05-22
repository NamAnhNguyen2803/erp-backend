'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Materials', {
      material_id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      code: {
        type: Sequelize.STRING(50),
        allowNull: false,
        unique: true
      },
      name: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      unit: {
        type: Sequelize.STRING(20),
        allowNull: false
      },
      factory: {
        type: Sequelize.STRING(100)
      },
      min_stock: {
        type: Sequelize.DECIMAL(10, 2)
      },
      max_stock: {
        type: Sequelize.DECIMAL(10, 2)
      },
      current_stock: {
        type: Sequelize.DECIMAL(10, 2)
      },
      unit_price: {
        type: Sequelize.DECIMAL(15, 2)
      },
      status: {
        type: Sequelize.STRING(20),
        defaultValue: 'active'
      },
      specification: {
        type: Sequelize.TEXT
      },
      supplier: {
        type: Sequelize.STRING(100)
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false
      }
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Materials');
  }
}; 