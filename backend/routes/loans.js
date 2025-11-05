const express = require('express');
const { Loan } = require('../models');
const auth = require('../middleware/auth');

const router = express.Router();

router.use(auth);

// Calculate monthly payment using amortization formula
const calculateMonthlyPayment = (principal, apr, termMonths) => {
  if (apr === 0) return principal / termMonths;
  const r = apr / 12 / 100;
  return principal * r / (1 - Math.pow(1 + r, -termMonths));
};

router.get('/', async (req, res) => {
  try {
    const loans = await Loan.findAll({
      where: { userId: req.userId },
      order: [['createdAt', 'DESC']]
    });
    res.json(loans);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { originalAmount, apr, termMonths } = req.body;
    const monthlyPayment = calculateMonthlyPayment(originalAmount, apr, termMonths);
    
    const loan = await Loan.create({
      ...req.body,
      userId: req.userId,
      currentBalance: originalAmount,
      monthlyPayment
    });
    res.status(201).json(loan);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const loan = await Loan.findOne({
      where: { id: req.params.id, userId: req.userId }
    });
    
    if (!loan) {
      return res.status(404).json({ error: 'Loan not found' });
    }

    if (req.body.originalAmount || req.body.apr || req.body.termMonths) {
      const originalAmount = req.body.originalAmount || loan.originalAmount;
      const apr = req.body.apr !== undefined ? req.body.apr : loan.apr;
      const termMonths = req.body.termMonths || loan.termMonths;
      req.body.monthlyPayment = calculateMonthlyPayment(originalAmount, apr, termMonths);
    }

    await loan.update(req.body);
    res.json(loan);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const loan = await Loan.findOne({
      where: { id: req.params.id, userId: req.userId }
    });
    
    if (!loan) {
      return res.status(404).json({ error: 'Loan not found' });
    }

    await loan.destroy();
    res.json({ message: 'Loan deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;