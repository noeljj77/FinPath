'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Users table
    await queryInterface.createTable('users', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      email: {
        type: Sequelize.STRING(255),
        allowNull: false,
        unique: true
      },
      password: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      name: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false
      }
    });

    // Profiles table
    await queryInterface.createTable('profiles', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      userId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onDelete: 'CASCADE'
      },
      currentNetWorth: {
        type: Sequelize.DECIMAL(15, 2),
        defaultValue: 0
      },
      currentCreditScore: {
        type: Sequelize.INTEGER,
        defaultValue: 300
      },
      monthsSimulated: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false
      }
    });

    // Incomes table
    await queryInterface.createTable('incomes', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      userId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onDelete: 'CASCADE'
      },
      name: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      amount: {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: false
      },
      frequency: {
        type: Sequelize.ENUM('monthly', 'annual'),
        defaultValue: 'monthly'
      },
      isActive: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false
      }
    });

    // Expenses table
    await queryInterface.createTable('expenses', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      userId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onDelete: 'CASCADE'
      },
      name: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      amount: {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: false
      },
      category: {
        type: Sequelize.STRING(100),
        defaultValue: 'Other'
      },
      frequency: {
        type: Sequelize.ENUM('monthly', 'annual'),
        defaultValue: 'monthly'
      },
      isActive: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false
      }
    });

    // Loans table
    await queryInterface.createTable('loans', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      userId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onDelete: 'CASCADE'
      },
      name: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      originalAmount: {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: false
      },
      currentBalance: {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: false
      },
      apr: {
        type: Sequelize.DECIMAL(5, 2),
        allowNull: false
      },
      termMonths: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      monthlyPayment: {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: false
      },
      startMonth: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      isActive: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false
      }
    });

    // Loan Payments table
    await queryInterface.createTable('loan_payments', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      loanId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'loans', key: 'id' },
        onDelete: 'CASCADE'
      },
      month: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      paymentAmount: {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: false
      },
      principalPaid: {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: false
      },
      interestPaid: {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: false
      },
      remainingBalance: {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: false
      },
      wasMissed: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false
      }
    });

    // Investments table
    await queryInterface.createTable('investments', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      userId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onDelete: 'CASCADE'
      },
      name: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      startingBalance: {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: false
      },
      currentBalance: {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: false
      },
      monthlyContribution: {
        type: Sequelize.DECIMAL(15, 2),
        defaultValue: 0
      },
      annualReturnRate: {
        type: Sequelize.DECIMAL(5, 2),
        allowNull: false
      },
      isActive: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false
      }
    });

    // Transactions table
    await queryInterface.createTable('transactions', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      userId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onDelete: 'CASCADE'
      },
      month: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      type: {
        type: Sequelize.ENUM('income', 'expense', 'loan_payment', 'investment_gain', 'investment_contribution', 'lump_sum'),
        allowNull: false
      },
      category: {
        type: Sequelize.STRING(100),
        allowNull: true
      },
      description: {
        type: Sequelize.STRING(500),
        allowNull: false
      },
      amount: {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: false
      },
      relatedId: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      isSimulation: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false
      }
    });

    // Scenarios table
    await queryInterface.createTable('scenarios', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      userId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onDelete: 'CASCADE'
      },
      name: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      months: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      actions: {
        type: Sequelize.JSON,
        allowNull: true
      },
      results: {
        type: Sequelize.JSON,
        allowNull: true
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false
      }
    });

    // Credit Rules table
    await queryInterface.createTable('credit_rules', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      userId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        unique: true,
        references: { model: 'users', key: 'id' },
        onDelete: 'CASCADE'
      },
      rules: {
        type: Sequelize.JSON,
        allowNull: false
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false
      }
    });

    // Credit History table
    await queryInterface.createTable('credit_history', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      userId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onDelete: 'CASCADE'
      },
      month: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      score: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      breakdown: {
        type: Sequelize.JSON,
        allowNull: true
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false
      }
    });

    // Add indexes
    await queryInterface.addIndex('profiles', ['userId']);
    await queryInterface.addIndex('incomes', ['userId']);
    await queryInterface.addIndex('expenses', ['userId']);
    await queryInterface.addIndex('loans', ['userId']);
    await queryInterface.addIndex('loan_payments', ['loanId']);
    await queryInterface.addIndex('investments', ['userId']);
    await queryInterface.addIndex('transactions', ['userId', 'month']);
    await queryInterface.addIndex('scenarios', ['userId']);
    await queryInterface.addIndex('credit_history', ['userId', 'month']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('credit_history');
    await queryInterface.dropTable('credit_rules');
    await queryInterface.dropTable('scenarios');
    await queryInterface.dropTable('transactions');
    await queryInterface.dropTable('investments');
    await queryInterface.dropTable('loan_payments');
    await queryInterface.dropTable('loans');
    await queryInterface.dropTable('expenses');
    await queryInterface.dropTable('incomes');
    await queryInterface.dropTable('profiles');
    await queryInterface.dropTable('users');
  }
};