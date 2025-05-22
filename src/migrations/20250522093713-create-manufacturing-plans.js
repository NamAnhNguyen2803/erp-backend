'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('ManufacturingPlans', {
      plan_id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      plan_code: {
        type: Sequelize.STRING(50),
        allowNull: false
      },
      description: {
        type: Sequelize.TEXT
      },
      start_date: {
        type: Sequelize.DATE
      },
      end_date: {
        type: Sequelize.DATE
      },
      status: {
        type: Sequelize.STRING(20),
        allowNull: false,
        defaultValue: 'draft'
      },
      created_by: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Users',
          key: 'user_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'NO ACTION'
      },
      notes: {
        type: Sequelize.TEXT
      },
      priority: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
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

    // Add unique index for plan_code
    await queryInterface.addIndex('ManufacturingPlans', ['plan_code'], {
      unique: true,
      name: 'manufacturing_plans_plan_code_unique'
    });
  },

  async down(queryInterface, Sequelize) {
    // Remove the unique index first
    await queryInterface.removeIndex('ManufacturingPlans', 'manufacturing_plans_plan_code_unique');
    
    // Then drop the table
    await queryInterface.dropTable('ManufacturingPlans');
  }
};
