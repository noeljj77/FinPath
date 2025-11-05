const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Investment = sequelize.define('Investment', {
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
    startingBalance: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false
    },
    currentBalance: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false
    },
    monthlyContribution: {
      type: DataTypes.DECIMAL(15, 2),
      defaultValue: 0
    },
    annualReturnRate: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    }
  }, {
    tableName: 'investments',
    timestamps: true
  });

  return Investment;
};