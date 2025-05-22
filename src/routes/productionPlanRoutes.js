const express = require('express');
const router = express.Router();
const productionPlanController = require('../controllers/productionPlanController');
// Comment tạm thời middleware xác thực
// const { authenticateUser, authorizeManager } = require('../middleware/authMiddleware');

// GET /api/v1/production-plans - Get all production plans
router.get('/', productionPlanController.getAllProductionPlans);

// GET /api/v1/production-plans/:plan_id - Get production plan by ID with details
router.get('/:plan_id', productionPlanController.getProductionPlanById);

// POST /api/v1/production-plans - Create a new production plan
router.post('/', productionPlanController.createProductionPlan);

// PUT /api/v1/production-plans/:plan_id - Update production plan
router.put('/:plan_id', productionPlanController.updateProductionPlan);

module.exports = router; 