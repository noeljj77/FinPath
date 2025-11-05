const { Income, Expense, Loan, Investment, LoanPayment, Transaction, CreditHistory, CreditRule, Profile } = require('../models');

class SimulationEngine {
  constructor(userId) {
    this.userId = userId;
    this.timeline = [];
    this.creditScores = [];
  }

  async runSimulation(months, actions = []) {
    // Load user data
    const incomes = await Income.findAll({ where: { userId: this.userId, isActive: true } });
    const expenses = await Expense.findAll({ where: { userId: this.userId, isActive: true } });
    const loans = await Loan.findAll({ where: { userId: this.userId, isActive: true } });
    const investments = await Investment.findAll({ where: { userId: this.userId, isActive: true } });
    const creditRule = await CreditRule.findOne({ where: { userId: this.userId } });

    // Initialize state
    const state = {
      loans: loans.map(l => ({
        id: l.id,
        name: l.name,
        balance: parseFloat(l.currentBalance),
        originalAmount: parseFloat(l.originalAmount),
        apr: parseFloat(l.apr),
        termMonths: l.termMonths,
        monthlyPayment: parseFloat(l.monthlyPayment),
        startMonth: l.startMonth || 0,
        monthsPaid: 0,
        consecutiveOnTime: 0,
        totalPayments: 0,
        missedPayments: 0,
        type: l.name.toLowerCase().includes('home') || l.name.toLowerCase().includes('car') ? 'secured' : 'unsecured'
      })),
      investments: investments.map(i => ({
        id: i.id,
        name: i.name,
        balance: parseFloat(i.currentBalance),
        monthlyContribution: parseFloat(i.monthlyContribution || 0),
        annualReturn: parseFloat(i.annualReturnRate)
      })),
      incomes: incomes.map(i => ({
        id: i.id,
        name: i.name,
        amount: parseFloat(i.amount),
        frequency: i.frequency
      })),
      expenses: expenses.map(e => ({
        id: e.id,
        name: e.name,
        amount: parseFloat(e.amount),
        category: e.category,
        frequency: e.frequency
      })),
      missedPayments: [],
      loanPayments: [],
      creditAge: 0,
      hasDefault: false,
      monthsSinceDefault: 0,
      recentInquiries: 0
    };

    // Process actions
    const actionsByMonth = {};
    actions.forEach(action => {
      if (!actionsByMonth[action.month]) {
        actionsByMonth[action.month] = [];
      }
      actionsByMonth[action.month].push(action);
    });

    // Month-by-month simulation
    for (let month = 0; month < months; month++) {
      const monthData = await this.simulateMonth(month, state, actionsByMonth[month] || [], creditRule);
      this.timeline.push(monthData);
    }

    // Persist results
    await this.persistResults(state);

    return {
      timeline: this.timeline,
      creditHistory: this.creditScores,
      finalNetWorth: this.timeline[this.timeline.length - 1]?.netWorth || 0,
      finalCreditScore: this.creditScores[this.creditScores.length - 1]?.score || 300
    };
  }

  async simulateMonth(month, state, actions, creditRule) {
    const monthData = {
      month,
      income: 0,
      expenses: 0,
      loanPayments: 0,
      investmentGains: 0,
      investmentContributions: 0,
      cashflow: 0,
      netWorth: 0,
      totalDebt: 0,
      totalAssets: 0,
      transactions: []
    };

    // Apply actions for this month
    this.applyActions(month, state, actions);

    // Calculate income
    state.incomes.forEach(income => {
      const amount = income.frequency === 'annual' ? income.amount / 12 : income.amount;
      monthData.income += amount;
      monthData.transactions.push({
        type: 'income',
        description: income.name,
        amount,
        relatedId: income.id
      });
    });

    // Calculate expenses
    state.expenses.forEach(expense => {
      const amount = expense.frequency === 'annual' ? expense.amount / 12 : expense.amount;
      monthData.expenses += amount;
      monthData.transactions.push({
        type: 'expense',
        category: expense.category,
        description: expense.name,
        amount,
        relatedId: expense.id
      });
    });

    // Process loans
    state.loans.forEach(loan => {
      if (month < loan.startMonth || loan.balance <= 0) return;

      const isMissed = state.missedPayments.some(mp => mp.loanId === loan.id && mp.month === month);

      if (!isMissed && loan.balance > 0) {
        const monthlyRate = loan.apr / 12 / 100;
        const interest = loan.balance * monthlyRate;
        const principal = Math.min(loan.monthlyPayment - interest, loan.balance);
        const payment = principal + interest;

        loan.balance -= principal;
        loan.monthsPaid++;
        loan.totalPayments++;
        loan.consecutiveOnTime++;

        monthData.loanPayments += payment;
        monthData.transactions.push({
          type: 'loan_payment',
          description: `${loan.name} payment`,
          amount: payment,
          relatedId: loan.id
        });

        state.loanPayments.push({
          loanId: loan.id,
          month,
          paymentAmount: payment,
          principalPaid: principal,
          interestPaid: interest,
          remainingBalance: loan.balance,
          wasMissed: false
        });
      } else if (isMissed) {
        loan.missedPayments++;
        loan.consecutiveOnTime = 0;
        
        state.loanPayments.push({
          loanId: loan.id,
          month,
          paymentAmount: 0,
          principalPaid: 0,
          interestPaid: 0,
          remainingBalance: loan.balance,
          wasMissed: true
        });
      }
    });

    // Process investments
    state.investments.forEach(investment => {
      if (investment.monthlyContribution > 0) {
        investment.balance += investment.monthlyContribution;
        monthData.investmentContributions += investment.monthlyContribution;
        monthData.transactions.push({
          type: 'investment_contribution',
          description: `${investment.name} contribution`,
          amount: investment.monthlyContribution,
          relatedId: investment.id
        });
      }

      const monthlyReturn = investment.annualReturn / 12 / 100;
      const gain = investment.balance * monthlyReturn;
      investment.balance += gain;
      monthData.investmentGains += gain;

      if (gain > 0) {
        monthData.transactions.push({
          type: 'investment_gain',
          description: `${investment.name} returns`,
          amount: gain,
          relatedId: investment.id
        });
      }
    });

    // Calculate totals
    monthData.totalDebt = state.loans.reduce((sum, l) => sum + l.balance, 0);
    monthData.totalAssets = state.investments.reduce((sum, i) => sum + i.balance, 0);
    monthData.cashflow = monthData.income - monthData.expenses - monthData.loanPayments + monthData.investmentGains;
    monthData.netWorth = monthData.totalAssets - monthData.totalDebt;

    // Increment credit age
    state.creditAge++;

    // Calculate credit score with Indian system
    const creditScore = this.calculateIndianCreditScore(month, state, monthData);
    monthData.creditScore = creditScore.score;
    monthData.creditCategory = creditScore.category;
    this.creditScores.push({
      month,
      score: creditScore.score,
      category: creditScore.category,
      breakdown: creditScore.breakdown
    });

    return monthData;
  }

  applyActions(month, state, actions) {
    actions.forEach(action => {
      switch (action.type) {
        case 'missed_payment':
          state.missedPayments.push({
            loanId: action.loanId,
            month
          });
          break;

        case 'income_change':
          const income = state.incomes.find(i => i.id === action.incomeId);
          if (income) income.amount = action.newAmount;
          break;

        case 'expense_change':
          const expense = state.expenses.find(e => e.id === action.expenseId);
          if (expense) expense.amount = action.newAmount;
          break;

        case 'lump_sum':
          const loan = state.loans.find(l => l.id === action.loanId);
          if (loan) {
            loan.balance = Math.max(0, loan.balance - action.amount);
          }
          break;

        case 'investment_change':
          const investment = state.investments.find(i => i.id === action.investmentId);
          if (investment && action.monthlyContribution !== undefined) {
            investment.monthlyContribution = action.monthlyContribution;
          }
          break;

        case 'new_loan':
          state.recentInquiries++;
          break;
      }
    });
  }

  calculateIndianCreditScore(month, state, monthData) {
    let score = 300; // Starting base
    const breakdown = {
      paymentHistory: 0,
      utilization: 0,
      creditAge: 0,
      creditMix: 0,
      debtToIncome: 0,
      recentInquiries: 0,
      recovery: 0
    };

    // 1. PAYMENT HISTORY (35-40% weight) - Most Important
    if (state.loans.length > 0) {
      let paymentScore = 0;
      let totalOnTime = 0;
      let totalMissed = 0;

      state.loans.forEach(loan => {
        totalOnTime += loan.consecutiveOnTime;
        totalMissed += loan.missedPayments;
      });

      // Base payment history score
      if (totalMissed === 0 && totalOnTime > 0) {
        paymentScore = 200; // Perfect payment history
      } else if (totalMissed === 0) {
        paymentScore = 150; // No history yet
      } else {
        // Calculate penalty for missed payments
        const missedLast12Months = state.missedPayments.filter(mp => mp.month >= month - 12 && mp.month <= month).length;
        paymentScore = Math.max(0, 200 - (missedLast12Months * 40) - (totalMissed * 20));
      }

      // Bonus for consecutive on-time payments
      const avgConsecutive = totalOnTime / state.loans.length;
      if (avgConsecutive >= 24) paymentScore += 50; // 2 years perfect
      else if (avgConsecutive >= 12) paymentScore += 30; // 1 year perfect
      else if (avgConsecutive >= 6) paymentScore += 15; // 6 months perfect

      breakdown.paymentHistory = Math.min(350, paymentScore);
      score += breakdown.paymentHistory;
    }

    // 2. CREDIT UTILIZATION (20-25% weight)
    if (state.loans.length > 0) {
      const totalOriginal = state.loans.reduce((sum, l) => sum + l.originalAmount, 0);
      const totalCurrent = state.loans.reduce((sum, l) => sum + l.balance, 0);
      const utilization = totalOriginal > 0 ? (totalCurrent / totalOriginal) * 100 : 0;

      let utilizationScore = 0;
      if (utilization < 30) {
        utilizationScore = 150; // Excellent
      } else if (utilization < 50) {
        utilizationScore = 100; // Good
      } else if (utilization < 75) {
        utilizationScore = 50; // Fair
      } else if (utilization < 90) {
        utilizationScore = 20; // Poor
      } else {
        utilizationScore = 0; // Very poor
      }

      breakdown.utilization = utilizationScore;
      score += breakdown.utilization;
    }

    // 3. CREDIT AGE / LENGTH OF HISTORY (15% weight)
    let ageScore = 0;
    const yearsOfCredit = state.creditAge / 12;

    if (yearsOfCredit >= 7) {
      ageScore = 100; // Excellent
    } else if (yearsOfCredit >= 5) {
      ageScore = 85;
    } else if (yearsOfCredit >= 3) {
      ageScore = 70;
    } else if (yearsOfCredit >= 2) {
      ageScore = 50;
    } else if (yearsOfCredit >= 1) {
      ageScore = 30;
    } else if (yearsOfCredit >= 0.5) {
      ageScore = 15;
    } else {
      ageScore = 5;
    }

    breakdown.creditAge = ageScore;
    score += breakdown.creditAge;

    // 4. CREDIT MIX (10% weight)
    const hasSecured = state.loans.some(l => l.type === 'secured');
    const hasUnsecured = state.loans.some(l => l.type === 'unsecured');
    
    let mixScore = 0;
    if (hasSecured && hasUnsecured) {
      mixScore = 60; // Good mix
    } else if (hasSecured) {
      mixScore = 40; // Only secured (good but limited)
    } else if (hasUnsecured) {
      mixScore = 20; // Only unsecured (risky)
    }

    breakdown.creditMix = mixScore;
    score += breakdown.creditMix;

    // 5. DEBT-TO-INCOME RATIO (10% weight)
    const monthlyIncome = state.incomes.reduce((sum, i) => {
      return sum + (i.frequency === 'annual' ? i.amount / 12 : i.amount);
    }, 0);

    const monthlyDebtPayments = state.loans.reduce((sum, l) => sum + l.monthlyPayment, 0);
    const dti = monthlyIncome > 0 ? (monthlyDebtPayments / monthlyIncome) * 100 : 0;

    let dtiScore = 0;
    if (dti < 35) {
      dtiScore = 60; // Excellent
    } else if (dti < 50) {
      dtiScore = 40; // Good
    } else if (dti < 70) {
      dtiScore = 15; // Fair
    } else {
      dtiScore = 0; // Poor
    }

    breakdown.debtToIncome = dtiScore;
    score += breakdown.debtToIncome;

    // 6. RECENT INQUIRIES / NEW CREDIT (5% weight)
    let inquiryScore = 30;
    if (state.recentInquiries > 0) {
      inquiryScore = Math.max(0, 30 - (state.recentInquiries * 10));
    }

    breakdown.recentInquiries = inquiryScore;
    score += breakdown.recentInquiries;

    // 7. RECOVERY FROM DEFAULTS (5% weight)
    if (state.hasDefault) {
      state.monthsSinceDefault++;
      if (state.monthsSinceDefault >= 24) {
        breakdown.recovery = 30; // Full recovery after 2 years
      } else if (state.monthsSinceDefault >= 18) {
        breakdown.recovery = 20;
      } else if (state.monthsSinceDefault >= 12) {
        breakdown.recovery = 10;
      }
      score += breakdown.recovery;
    }

    // Clamp score between 300 and 900
    score = Math.max(300, Math.min(900, Math.round(score)));

    // Determine category
    let category = 'Poor';
    if (score >= 850) category = 'Excellent';
    else if (score >= 750) category = 'Very Good';
    else if (score >= 650) category = 'Good';
    else if (score >= 550) category = 'Fair';

    return { score, category, breakdown };
  }

  async persistResults(state) {
    for (const loan of state.loans) {
      await Loan.update(
        { currentBalance: loan.balance },
        { where: { id: loan.id } }
      );
    }

    for (const investment of state.investments) {
      await Investment.update(
        { currentBalance: investment.balance },
        { where: { id: investment.id } }
      );
    }

    for (const payment of state.loanPayments) {
      await LoanPayment.create({
        ...payment,
        userId: this.userId
      });
    }

    for (let i = 0; i < this.timeline.length; i++) {
      const monthData = this.timeline[i];
      for (const trans of monthData.transactions) {
        await Transaction.create({
          userId: this.userId,
          month: monthData.month,
          type: trans.type,
          category: trans.category,
          description: trans.description,
          amount: trans.amount,
          relatedId: trans.relatedId,
          isSimulation: true
        });
      }
    }

    for (const credit of this.creditScores) {
      await CreditHistory.create({
        userId: this.userId,
        month: credit.month,
        score: credit.score,
        breakdown: credit.breakdown
      });
    }

    const lastMonth = this.timeline[this.timeline.length - 1];
    await Profile.update(
      {
        currentNetWorth: lastMonth.netWorth,
        currentCreditScore: this.creditScores[this.creditScores.length - 1].score,
        monthsSimulated: this.timeline.length
      },
      { where: { userId: this.userId } }
    );
  }
}

module.exports = SimulationEngine;