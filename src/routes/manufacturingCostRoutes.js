const express = require('express');
const router = express.Router();
const manufacturingCostController = require('../controllers/manufacturingCostController');
// Comment tạm thời middleware xác thực
// const { authenticateUser, authorizeManager } = require('../middleware/authMiddleware');

// GET /api/v1/manufacturing-costs - Get all production costs
router.get('/', manufacturingCostController.getAllManufacturingCosts);

// POST /api/v1/manufacturing-costs - Create a new manufacturing cost
router.post('/', manufacturingCostController.createManufacturingCost);

module.exports = router; 