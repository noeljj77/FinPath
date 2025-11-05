const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const CreditHistory = sequelize.define('CreditHistory', {
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
    month: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    score: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    breakdown: {
      type: DataTypes.JSON,
      allowNull: true
    }
  }, {
    tableName: 'credit_history',
    timestamps: true
  });

  return CreditHistory;
};