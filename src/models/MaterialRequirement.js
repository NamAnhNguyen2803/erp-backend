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
    },
    material_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    required_quantity: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
   
  }, {
    tableName: 'materialRequirements',
    timestamps: true,
  });

  module.exports = MaterialRequirement;
