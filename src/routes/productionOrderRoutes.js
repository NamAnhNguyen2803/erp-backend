const express = require('express');
const router = express.Router();
const productionOrderController = require('../controllers/productionOrderController');
// Comment tạm thời middleware xác thực
// const { authenticateUser, authorizeManager } = require('../middleware/authMiddleware');

// GET /api/v1/production-orders - Get all production orders
router.get('/', productionOrderController.getAllProductionOrders);

// GET /api/v1/production-orders/:order_id - Get production order by ID
router.get('/:order_id', productionOrderController.getProductionOrderById);

// POST /api/v1/production-orders - Create a new production order
router.post('/', productionOrderController.createProductionOrder);

// PUT /api/v1/production-orders/:order_id - Update production order
router.put('/:order_id', productionOrderController.updateProductionOrder);

module.exports = router; 