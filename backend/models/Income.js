const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Income = sequelize.define('Income', {
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
    amount: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false
    },
    frequency: {
      type: DataTypes.ENUM('monthly', 'annual'),
      defaultValue: 'monthly'
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    }
  }, {
    tableName: 'incomes',
    timestamps: true
  });

  return Income;
};