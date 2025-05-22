const express = require('express');
const router = express.Router();
const inventoryTransactionController = require('../controllers/inventoryTransactionController');
// Comment tạm thời middleware xác thực
// const { authenticateUser, authorizeManager } = require('../middleware/authMiddleware');

// GET /api/v1/inventory-transactions - Get all inventory transactions
router.get('/', inventoryTransactionController.getAllInventoryTransactions);

// POST /api/v1/inventory-transactions - Create a new inventory transaction
router.post('/', inventoryTransactionController.createInventoryTransaction);

module.exports = router; 