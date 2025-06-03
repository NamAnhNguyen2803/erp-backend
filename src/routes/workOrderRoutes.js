const express = require('express');
const router = express.Router();
const WorkOrderController = require('../controllers/workOrderController');
// Comment tạm thời middleware xác thực
// const { authenticateUser, authorizeManager } = require('../middleware/authMiddleware');
router.get('/:id/material-status', WorkOrderController.getMaterialStatus);
router.get('/', WorkOrderController.getAll);
router.get('/:id', WorkOrderController.getByWorkId);

router.post('/', WorkOrderController.create);
router.put('/:id', WorkOrderController.update);
router.delete('/:id', WorkOrderController.delete);

// Action routes
router.patch('/:id/start', WorkOrderController.start);
router.patch('/:id/complete', WorkOrderController.complete);
router.patch('/:id/assign', WorkOrderController.assign);

// Special routes
router.get('/my-tasks', WorkOrderController.getMyTasks);
router.get('/statistics', WorkOrderController.getStatistics);

module.exports = router; 