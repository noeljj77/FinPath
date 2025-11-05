const express = require('express');
const auth = require('../middleware/auth');
const SimulationEngine = require('../services/simulationEngine');
const { Loan, Investment, Transaction, LoanPayment, CreditHistory, Profile } = require('../models');

const router = express.Router();

router.use(auth);

// Reset to original values without running simulation
router.post('/reset', async (req, res) => {
  try {
    // Reset all loans to original amounts
    const loans = await Loan.findAll({ where: { userId: req.userId } });
    for (const loan of loans) {
      await loan.update({ currentBalance: loan.originalAmount });
    }

    // Reset all investments to starting balances
    const investments = await Investment.findAll({ where: { userId: req.userId } });
    for (const investment of investments) {
      await investment.update({ currentBalance: investment.startingBalance });
    }

    // Clear all transactions
    await Transaction.destroy({ 
      where: { userId: req.userId } 
    });

    // Clear loan payments
    const loanIds = loans.map(l => l.id);
    if (loanIds.length > 0) {
      await LoanPayment.destroy({ 
        where: { loanId: loanIds } 
      });
    }

    // Clear credit history
    await CreditHistory.destroy({ 
      where: { userId: req.userId } 
    });

    // Reset profile
    await Profile.update(
      {
        currentNetWorth: 0,
        currentCreditScore: 300,
        monthsSimulated: 0
      },
      { where: { userId: req.userId } }
    );

    res.json({ message: 'Successfully reset to original values' });
  } catch (error) {
    console.error('Reset error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { months = 12, actions = [] } = req.body;

    if (months < 1 || months > 360) {
      return res.status(400).json({ error: 'Months must be between 1 and 360' });
    }

    // Reset all loans to original amounts
    const loans = await Loan.findAll({ where: { userId: req.userId } });
    for (const loan of loans) {
      await loan.update({ currentBalance: loan.originalAmount });
    }

    // Reset all investments to starting balances
    const investments = await Investment.findAll({ where: { userId: req.userId } });
    for (const investment of investments) {
      await investment.update({ currentBalance: investment.startingBalance });
    }

    // Clear ALL previous transactions
    await Transaction.destroy({ 
      where: { userId: req.userId } 
    });

    // Clear previous loan payments
    const loanIds = loans.map(l => l.id);
    if (loanIds.length > 0) {
      await LoanPayment.destroy({ 
        where: { loanId: loanIds } 
      });
    }

    // Clear previous credit history
    await CreditHistory.destroy({ 
      where: { userId: req.userId } 
    });

    // Run fresh simulation
    const engine = new SimulationEngine(req.userId);
    const results = await engine.runSimulation(months, actions);

    res.json(results);
  } catch (error) {
    console.error('Simulation error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;