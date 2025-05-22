const express = require('express');
const router = express.Router();
const workOrderController = require('../controllers/workOrderController');
// Comment tạm thời middleware xác thực
// const { authenticateUser, authorizeManager } = require('../middleware/authMiddleware');

// GET /api/v1/work-orders - Get all work orders
router.get('/', workOrderController.getAllWorkOrders);

// GET /api/v1/work-orders/:work_id - Get work order by ID
router.get('/:work_id', workOrderController.getWorkOrderById);

// POST /api/v1/work-orders - Create a new work order
router.post('/', workOrderController.createWorkOrder);

// PUT /api/v1/work-orders/:work_id - Update work order
router.put('/:work_id', workOrderController.updateWorkOrder);

module.exports = router; 