const express = require('express');
const { Income } = require('../models');
const auth = require('../middleware/auth');

const router = express.Router();

router.use(auth);

router.get('/', async (req, res) => {
  try {
    const incomes = await Income.findAll({
      where: { userId: req.userId },
      order: [['createdAt', 'DESC']]
    });
    res.json(incomes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const income = await Income.create({
      ...req.body,
      userId: req.userId
    });
    res.status(201).json(income);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const income = await Income.findOne({
      where: { id: req.params.id, userId: req.userId }
    });
    
    if (!income) {
      return res.status(404).json({ error: 'Income not found' });
    }

    await income.update(req.body);
    res.json(income);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const income = await Income.findOne({
      where: { id: req.params.id, userId: req.userId }
    });
    
    if (!income) {
      return res.status(404).json({ error: 'Income not found' });
    }

    await income.destroy();
    res.json({ message: 'Income deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;