const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Journal = sequelize.define('Journal', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  abstract: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  authors: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  publication_date: {
    type: DataTypes.DATEONLY,
    allowNull: true,
  },
  publisher: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  doi: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  keywords: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  file_url: {
    type: DataTypes.STRING,
    allowNull: true,
  },
}, {
  tableName: 'journals',
  timestamps: false,
  underscored: true, // jika suatu saat tambahkan timestamps, ini akan buat created_at & updated_at
});

module.exports = Journal;