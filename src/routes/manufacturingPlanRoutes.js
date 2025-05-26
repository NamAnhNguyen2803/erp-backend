const express = require('express');
const router = express.Router();
const manufacturingPlanController = require('../controllers/manufacturingPlanController');
// Comment tạm thời middleware xác thực
// const { authenticateUser, authorizeManager } = require('../middleware/authMiddleware');

// GET /api/v1/manufacturing-plans - Get all manufacturing plans
router.get('/', manufacturingPlanController.getAllManufacturingPlans);

// GET /api/v1/manufacturing-plans/:plan_id - Get manufacturing plan by ID with details
router.get('/:plan_id', manufacturingPlanController.getManufacturingPlanById);

// POST /api/v1/manufacturing-plans - Create a new manufacturing plan
router.post('/', manufacturingPlanController.createManufacturingPlan);

// PUT /api/v1/manufacturing-plans/:plan_id - Update manufacturing plan
router.put('/:plan_id', manufacturingPlanController.updateManufacturingPlan);

module.exports = router; 