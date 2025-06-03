const express = require('express');
const router = express.Router();
const ManufacturingOrderDetailController = require('../controllers/manufacturingOrderDetailController');
const WorkOrderController = require('../controllers/workOrderController');
// order-details
router.get('/:order_id', ManufacturingOrderDetailController.getByOrderId);
router.post('/', ManufacturingOrderDetailController.create);
router.put('/:id', ManufacturingOrderDetailController.update);
router.delete('/:id', ManufacturingOrderDetailController.delete);
router.get('/work-orders/:id', WorkOrderController.getByOrderId);
// Action routes
router.patch('/:id/status', ManufacturingOrderDetailController.updateStatus);
router.patch('/:id/produced-quantity', ManufacturingOrderDetailController.updateProducedQuantity);

module.exports = router;