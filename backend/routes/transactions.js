const express = require('express');
const { Transaction } = require('../models');
const auth = require('../middleware/auth');
const { Op } = require('sequelize');

const router = express.Router();

router.use(auth);

router.get('/', async (req, res) => {
  try {
    const { type, month, isSimulation } = req.query;
    const where = { userId: req.userId };

    if (type) where.type = type;
    if (month !== undefined) where.month = month;
    if (isSimulation !== undefined) where.isSimulation = isSimulation === 'true';

    const transactions = await Transaction.findAll({
      where,
      order: [['month', 'ASC'], ['createdAt', 'ASC']]
    });

    res.json(transactions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;