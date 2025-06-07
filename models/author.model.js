const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Author = sequelize.define('Author', {
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  bio: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  photo: {
    type: DataTypes.STRING,
    allowNull: true,
  }
}, {
  tableName: 'authors',
});

module.exports = Author;
