const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Loan = sequelize.define('Loan', {
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
    originalAmount: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false
    },
    currentBalance: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false
    },
    apr: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false
    },
    termMonths: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    monthlyPayment: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false
    },
    startMonth: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    }
  }, {
    tableName: 'loans',
    timestamps: true
  });

  return Loan;
};