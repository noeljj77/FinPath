const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Scenario = sequelize.define('Scenario', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      },
      onDelete: 'CASCADE'
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    months: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    actions: {
      type: DataTypes.JSON,
      allowNull: true
    },
    results: {
      type: DataTypes.JSON,
      allowNull: true
    }
  }, {
    tableName: 'scenarios',
    timestamps: true
  });

  return Scenario;
};