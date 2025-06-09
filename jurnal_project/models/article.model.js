const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const User = require('./user.model');

class Article extends Model {}

Article.init(
  {
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    authorId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: User,
        key: 'id',
      },
    },
    status: {
      type: DataTypes.STRING,
      defaultValue: 'pending',
    },
    review: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: 'Article',
    tableName: 'articles',
    timestamps: true,
    underscored: true, // will generate created_at and updated_at
  }
);

// Relasi
Article.belongsTo(User, { foreignKey: 'authorId' });
User.hasMany(Article, { foreignKey: 'authorId' });

module.exports = Article;
