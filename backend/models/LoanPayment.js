const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const LoanPayment = sequelize.define('LoanPayment', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    loanId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'loans',
        key: 'id'
      },
      onDelete: 'CASCADE'
    },
    month: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    paymentAmount: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false
    },
    principalPaid: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false
    },
    interestPaid: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false
    },
    remainingBalance: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false
    },
    wasMissed: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    }
  }, {
    tableName: 'loan_payments',
    timestamps: true
  });

  return LoanPayment;
};