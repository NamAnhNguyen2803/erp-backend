const express = require('express');
const router = express.Router();
const manufacturingOrderController = require('../controllers/manufacturingOrderController');
// Comment tạm thời middleware xác thực
// const { authenticateUser, authorizeManager } = require('../middleware/authMiddleware');

// GET /api/v1/manufacturing-orders - Get all manufacturing orders
router.get('/', manufacturingOrderController.getAllManufacturingOrders);

// GET /api/v1/manufacturing-orders/:order_id - Get manufacturing order by ID
router.get('/:order_id', manufacturingOrderController.getManufacturingOrderById);

// POST /api/v1/manufacturing-orders - Create a new manufacturing order
router.post('/', manufacturingOrderController.createManufacturingOrder);

// PUT /api/v1/manufacturing-orders/:order_id - Update manufacturing order
router.put('/:order_id', manufacturingOrderController.updateManufacturingOrder);

module.exports = router; 