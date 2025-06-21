const Sequelize = require('sequelize');
require('dotenv').config();

// Sử dụng biến môi trường hoặc thông tin mặc định
const database = process.env.DB_NAME ;
const username = process.env.DB_USER || 'root';
const host = process.env.DB_HOST ;
const port = process.env.DB_PORT ;
password = process.env.DB_PASSWORD ;
// Cấu hình pool cho kết nối database
const pool = {
  max: 10,
  min: 0,
  acquire: 30000,
  idle: 10000
};

// Khởi tạo kết nối
const sequelize = new Sequelize(database, username, password, {
  host,
  port,
  dialect: 'postgres',
  pool,
  logging: console.log,
  define: {
    freezeTableName: true,
    timestamps: true,
    charset: 'utf8',
    collate: 'utf8_general_ci',
    dialectOptions: {
      useUTC: false
    }
  }
});

module.exports = sequelize; 