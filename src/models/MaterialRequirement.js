const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const WorkOrder = require('./WorkOrder');
const Material = require('./Material');

const MaterialRequirement = sequelize.define('MaterialRequirement', {
  requirement_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    field: 'requirement_id'
  },
  work_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: WorkOrder,
      key: 'work_id'
    },
    field: 'work_id'
  },
  material_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Material,
      key: 'material_id'
    },
    field: 'material_id'
  },
  required_quantity: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    field: 'required_quantity'
  },
  issued_quantity: {
    type: DataTypes.DECIMAL(10, 2),
    field: 'issued_quantity'
  }
}, {
  timestamps: true,
  tableName: 'material_requirements'
});

module.exports = MaterialRequirement; 