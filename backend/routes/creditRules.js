const express = require('express');
const { CreditRule } = require('../models');
const auth = require('../middleware/auth');

const router = express.Router();

router.use(auth);

router.get('/', async (req, res) => {
  try {
    let creditRule = await CreditRule.findOne({
      where: { userId: req.userId }
    });

    if (!creditRule) {
      creditRule = await CreditRule.create({
        userId: req.userId,
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
    }

    res.json(creditRule);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/', async (req, res) => {
  try {
    const [creditRule, created] = await CreditRule.findOrCreate({
      where: { userId: req.userId },
      defaults: { rules: req.body.rules }
    });

    if (!created) {
      await creditRule.update({ rules: req.body.rules });
    }

    res.json(creditRule);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;