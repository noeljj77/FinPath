const express = require('express');
const { Investment } = require('../models');
const auth = require('../middleware/auth');

const router = express.Router();

router.use(auth);

router.get('/', async (req, res) => {
  try {
    const investments = await Investment.findAll({
      where: { userId: req.userId },
      order: [['createdAt', 'DESC']]
    });
    res.json(investments);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const investment = await Investment.create({
      ...req.body,
      userId: req.userId,
      currentBalance: req.body.startingBalance
    });
    res.status(201).json(investment);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const investment = await Investment.findOne({
      where: { id: req.params.id, userId: req.userId }
    });
    
    if (!investment) {
      return res.status(404).json({ error: 'Investment not found' });
    }

    await investment.update(req.body);
    res.json(investment);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const investment = await Investment.findOne({
      where: { id: req.params.id, userId: req.userId }
    });
    
    if (!investment) {
      return res.status(404).json({ error: 'Investment not found' });
    }

    await investment.destroy();
    res.json({ message: 'Investment deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;