const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const WorkStation = sequelize.define('WorkStation', {
  station_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  code: {
    type: DataTypes.STRING(20),
    allowNull: false
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT
  },
  capacity: {
    type: DataTypes.DECIMAL(10, 2)
  },
  status: {
    type: DataTypes.STRING(20)
  }
}, {
  timestamps: true,
  tableName: 'WorkStations'
});

module.exports = WorkStation; 