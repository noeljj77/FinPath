const express = require('express');
const { Scenario } = require('../models');
const auth = require('../middleware/auth');
const SimulationEngine = require('../services/simulationEngine');

const router = express.Router();

router.use(auth);

router.get('/', async (req, res) => {
  try {
    const scenarios = await Scenario.findAll({
      where: { userId: req.userId },
      order: [['createdAt', 'DESC']]
    });
    res.json(scenarios);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const scenario = await Scenario.findOne({
      where: { id: req.params.id, userId: req.userId }
    });
    
    if (!scenario) {
      return res.status(404).json({ error: 'Scenario not found' });
    }

    res.json(scenario);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    // Create scenario
    const scenario = await Scenario.create({
      ...req.body,
      userId: req.userId
    });

    // Run simulation with the scenario's actions
    const engine = new SimulationEngine(req.userId);
    const results = await engine.runSimulation(req.body.months, req.body.actions || []);

    // Update scenario with results
    await scenario.update({ results });

    res.status(201).json(scenario);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const scenario = await Scenario.findOne({
      where: { id: req.params.id, userId: req.userId }
    });
    
    if (!scenario) {
      return res.status(404).json({ error: 'Scenario not found' });
    }

    await scenario.destroy();
    res.json({ message: 'Scenario deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;