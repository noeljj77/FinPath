const { Sequelize } = require('sequelize');
const config = require('../config/database')[process.env.NODE_ENV || 'development'];

const sequelize = new Sequelize(
  config.database,
  config.username,
  config.password,
  config
);

const User = require('./User')(sequelize);
const Profile = require('./Profile')(sequelize);
const Income = require('./Income')(sequelize);
const Expense = require('./Expense')(sequelize);
const Loan = require('./Loan')(sequelize);
const LoanPayment = require('./LoanPayment')(sequelize);
const Investment = require('./Investment')(sequelize);
const Transaction = require('./Transaction')(sequelize);
const Scenario = require('./Scenario')(sequelize);
const CreditRule = require('./CreditRule')(sequelize);
const CreditHistory = require('./CreditHistory')(sequelize);

// Associations
User.hasOne(Profile, { foreignKey: 'userId', as: 'profile' });
Profile.belongsTo(User, { foreignKey: 'userId' });

User.hasMany(Income, { foreignKey: 'userId', as: 'incomes' });
Income.belongsTo(User, { foreignKey: 'userId' });

User.hasMany(Expense, { foreignKey: 'userId', as: 'expenses' });
Expense.belongsTo(User, { foreignKey: 'userId' });

User.hasMany(Loan, { foreignKey: 'userId', as: 'loans' });
Loan.belongsTo(User, { foreignKey: 'userId' });

Loan.hasMany(LoanPayment, { foreignKey: 'loanId', as: 'payments' });
LoanPayment.belongsTo(Loan, { foreignKey: 'loanId' });

User.hasMany(Investment, { foreignKey: 'userId', as: 'investments' });
Investment.belongsTo(User, { foreignKey: 'userId' });

User.hasMany(Transaction, { foreignKey: 'userId', as: 'transactions' });
Transaction.belongsTo(User, { foreignKey: 'userId' });

User.hasMany(Scenario, { foreignKey: 'userId', as: 'scenarios' });
Scenario.belongsTo(User, { foreignKey: 'userId' });

User.hasOne(CreditRule, { foreignKey: 'userId', as: 'creditRule' });
CreditRule.belongsTo(User, { foreignKey: 'userId' });

User.hasMany(CreditHistory, { foreignKey: 'userId', as: 'creditHistory' });
CreditHistory.belongsTo(User, { foreignKey: 'userId' });

module.exports = {
  sequelize,
  User,
  Profile,
  Income,
  Expense,
  Loan,
  LoanPayment,
  Investment,
  Transaction,
  Scenario,
  CreditRule,
  CreditHistory
};