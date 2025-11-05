require('dotenv').config();
const bcrypt = require('bcryptjs');
const { sequelize, User, Profile, Income, Expense, Loan, Investment, CreditRule } = require('../models');

const calculateMonthlyPayment = (principal, apr, termMonths) => {
  if (apr === 0) return principal / termMonths;
  const r = apr / 12 / 100;
  return principal * r / (1 - Math.pow(1 + r, -termMonths));
};

async function seed() {
  try {
    await sequelize.authenticate();
    console.log('Database connected');

    // Create demo user
    const hashedPassword = await bcrypt.hash('Demo123!', 10);
    
    const user = await User.create({
      email: 'demo@example.com',
      password: hashedPassword,
      name: 'Demo User'
    });

    console.log('Created demo user');

    // Create profile
    await Profile.create({
      userId: user.id,
      currentNetWorth: 0,
      currentCreditScore: 300,
      monthsSimulated: 0
    });

    console.log('Created profile');

    // Create credit rules
    await CreditRule.create({
      userId: user.id,
      rules: {
        base: 300,
        max: 850,
        weights: {
          payment_history: 0.4,
          utilization: 0.25,
          length: 0.1,
          recent_changes: 0.1,
          mix_and_stability: 0.15
        },
        penalties: {
          missed_payment_last_12m: 40
        }
      }
    });

    console.log('Created credit rules');

    // Create incomes
    await Income.create({
      userId: user.id,
      name: 'Salary',
      amount: 5000.00,
      frequency: 'monthly',
      isActive: true
    });

    await Income.create({
      userId: user.id,
      name: 'Freelance Work',
      amount: 1200.00,
      frequency: 'monthly',
      isActive: true
    });

    console.log('Created incomes');

    // Create expenses
    await Expense.create({
      userId: user.id,
      name: 'Rent',
      amount: 1500.00,
      category: 'Housing',
      frequency: 'monthly',
      isActive: true
    });

    await Expense.create({
      userId: user.id,
      name: 'Groceries',
      amount: 600.00,
      category: 'Food',
      frequency: 'monthly',
      isActive: true
    });

    await Expense.create({
      userId: user.id,
      name: 'Utilities',
      amount: 200.00,
      category: 'Housing',
      frequency: 'monthly',
      isActive: true
    });

    await Expense.create({
      userId: user.id,
      name: 'Car Insurance',
      amount: 1200.00,
      category: 'Transportation',
      frequency: 'annual',
      isActive: true
    });

    console.log('Created expenses');

    // Create loans
    const carLoanAmount = 25000;
    const carLoanAPR = 4.5;
    const carLoanTerm = 60;
    const carLoanPayment = calculateMonthlyPayment(carLoanAmount, carLoanAPR, carLoanTerm);

    await Loan.create({
      userId: user.id,
      name: 'Car Loan',
      originalAmount: carLoanAmount,
      currentBalance: carLoanAmount,
      apr: carLoanAPR,
      termMonths: carLoanTerm,
      monthlyPayment: carLoanPayment,
      startMonth: 0,
      isActive: true
    });

    const creditCardAmount = 3000;
    const creditCardAPR = 18.99;
    const creditCardTerm = 24;
    const creditCardPayment = calculateMonthlyPayment(creditCardAmount, creditCardAPR, creditCardTerm);

    await Loan.create({
      userId: user.id,
      name: 'Credit Card Debt',
      originalAmount: creditCardAmount,
      currentBalance: creditCardAmount,
      apr: creditCardAPR,
      termMonths: creditCardTerm,
      monthlyPayment: creditCardPayment,
      startMonth: 0,
      isActive: true
    });

    console.log('Created loans');

    // Create investments
    await Investment.create({
      userId: user.id,
      name: '401(k)',
      startingBalance: 15000.00,
      currentBalance: 15000.00,
      monthlyContribution: 500.00,
      annualReturnRate: 7.0,
      isActive: true
    });

    await Investment.create({
      userId: user.id,
      name: 'Emergency Fund',
      startingBalance: 5000.00,
      currentBalance: 5000.00,
      monthlyContribution: 200.00,
      annualReturnRate: 2.5,
      isActive: true
    });

    console.log('Created investments');

    console.log('\n=== Seed Complete ===');
    console.log('Demo User Credentials:');
    console.log('Email: demo@example.com');
    console.log('Password: Demo123!');
    console.log('\nDemo Data:');
    console.log('- 2 Income sources ($6,200/month total)');
    console.log('- 4 Expenses ($2,400/month)');
    console.log('- 2 Loans ($28,000 total debt)');
    console.log('- 2 Investments ($20,000 starting balance)');

    process.exit(0);
  } catch (error) {
    console.error('Seeding error:', error);
    process.exit(1);
  }
}

seed();