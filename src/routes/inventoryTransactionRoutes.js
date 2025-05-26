const express = require('express');
const router = express.Router();
const inventoryTransactionController = require('../controllers/inventoryTransactionController');
// Comment tạm thời middleware xác thực
// const { authenticateUser, authorizeManager } = require('../middleware/authMiddleware');

// GET /api/v1/transactions
// router.get('/', inventoryTransactionController.getAllInventoryTransactions);
router.post('/import', inventoryTransactionController.importGoods);
router.post('/export', inventoryTransactionController.exportGoods);
router.post('/transfer', inventoryTransactionController.transferGoods);
router.get('/', inventoryTransactionController.getInventorySummary);
router.get('/all', inventoryTransactionController.getAllInventoryTransactions);
router.get('/{id}', inventoryTransactionController.getTransactionById);

module.exports = router; 