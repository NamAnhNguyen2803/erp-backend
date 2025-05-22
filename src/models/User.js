const { DataTypes } = require('sequelize');
const bcrypt = require('bcrypt');
const sequelize = require('../config/database');

const User = sequelize.define('User', {
  user_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    field: 'user_id'
  },
  username: {
    type: DataTypes.STRING(50),
    allowNull: false,
    field: 'username'
  },
  password: {
    type: DataTypes.STRING(255),
    allowNull: false,
    field: 'password'
  },
  fullname: {
    type: DataTypes.STRING(100),
    field: 'fullname'
  },
  email: {
    type: DataTypes.STRING(100),
    field: 'email'
  },
  phone: {
    type: DataTypes.STRING(20),
    field: 'phone'
  },
  role: {
    type: DataTypes.STRING(20),
    allowNull: false,
    defaultValue: 'staff',
    field: 'role'
  },
  department: {
    type: DataTypes.STRING(50),
    field: 'department'
  },
  avatar: {
    type: DataTypes.STRING(255),
    field: 'avatar'
  },
  last_login: {
    type: DataTypes.DATE,
    field: 'last_login'
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    field: 'is_active'
  }
}, {
  timestamps: true,
  tableName: 'users',
  hooks: {
    beforeCreate: async (user) => {
      if (user.password) {
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(user.password, salt);
      }
    },
    beforeUpdate: async (user) => {
      if (user.changed('password')) {
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(user.password, salt);
      }
    }
  }
});

// Kiểm tra password
User.prototype.checkPassword = async function(password) {
  return await bcrypt.compare(password, this.password);
};

module.exports = User; 