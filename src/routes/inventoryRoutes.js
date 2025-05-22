const express = require('express');
const router = express.Router();
const inventoryController = require('../controllers/inventoryController');
// Comment tạm thời middleware xác thực
// const { authenticateUser, authorizeManager } = require('../middleware/authMiddleware');

// GET /api/v1/inventory - Get all inventory
router.get('/', inventoryController.getAllInventory);

// GET /api/v1/inventory/:inventory_id - Get inventory by ID
router.get('/:inventory_id', inventoryController.getInventoryById);

// POST /api/v1/inventory - Create a new inventory record
router.post('/', inventoryController.createInventory);

// PUT /api/v1/inventory/:inventory_id - Update inventory
router.put('/:inventory_id', inventoryController.updateInventory);

module.exports = router; 