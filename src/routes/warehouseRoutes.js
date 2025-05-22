const express = require('express');
const router = express.Router();
const warehouseController = require('../controllers/warehouseController');
// Comment tạm thời middleware xác thực
// const { authenticateUser, authorizeManager } = require('../middleware/authMiddleware');

// GET /api/v1/warehouses - Get all warehouses
router.get('/', warehouseController.getAllWarehouses);

// GET /api/v1/warehouses/:warehouse_id - Get warehouse by ID
router.get('/:warehouse_id', warehouseController.getWarehouseById);

// POST /api/v1/warehouses - Create a new warehouse
router.post('/', warehouseController.createWarehouse);

// PUT /api/v1/warehouses/:warehouse_id - Update warehouse
router.put('/:warehouse_id', warehouseController.updateWarehouse);

// DELETE /api/v1/warehouses/:warehouse_id - Delete warehouse
router.delete('/:warehouse_id', warehouseController.deleteWarehouse);

module.exports = router; 