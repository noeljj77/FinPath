const express = require('express');
const { Expense } = require('../models');
const auth = require('../middleware/auth');

const router = express.Router();

router.use(auth);

router.get('/', async (req, res) => {
  try {
    const expenses = await Expense.findAll({
      where: { userId: req.userId },
      order: [['createdAt', 'DESC']]
    });
    res.json(expenses);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const expense = await Expense.create({
      ...req.body,
      userId: req.userId
    });
    res.status(201).json(expense);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const expense = await Expense.findOne({
      where: { id: req.params.id, userId: req.userId }
    });
    
    if (!expense) {
      return res.status(404).json({ error: 'Expense not found' });
    }

    await expense.update(req.body);
    res.json(expense);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const expense = await Expense.findOne({
      where: { id: req.params.id, userId: req.userId }
    });
    
    if (!expense) {
      return res.status(404).json({ error: 'Expense not found' });
    }

    await expense.destroy();
    res.json({ message: 'Expense deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;