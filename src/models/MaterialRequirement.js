const { DataTypes } = require('sequelize');
const sequelize = require('../config/database'); // import sequelize instance

const MaterialRequirement = sequelize.define('MaterialRequirement', {
  requirement_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,

  },
  work_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    unique: true,
  },
  material_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    unique: true,
  },
  required_quantity: {
    type: DataTypes.FLOAT,
    allowNull: false,
  },

}, {
  tableName: 'material_requirements',
  timestamps: true,
    freezeTableName: true
});

module.exports = MaterialRequirement;
