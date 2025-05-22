const express = require('express');
const router = express.Router();
const productionCostController = require('../controllers/productionCostController');
// Comment tạm thời middleware xác thực
// const { authenticateUser, authorizeManager } = require('../middleware/authMiddleware');

// GET /api/v1/production-costs - Get all production costs
router.get('/', productionCostController.getAllProductionCosts);

// POST /api/v1/production-costs - Create a new production cost
router.post('/', productionCostController.createProductionCost);

module.exports = router; 