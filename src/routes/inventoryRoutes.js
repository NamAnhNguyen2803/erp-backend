const express = require('express');
const router = express.Router();
const inventoryController = require('../controllers/inventoryController');
// Comment tạm thời middleware xác thực
// const { authenticateUser, authorizeManager } = require('../middleware/authMiddleware');

// GET /api/v1/inventory - Get all inventory
router.get('/', inventoryController.getAllInventory);
router.get('/materials', inventoryController.getInventoryByMaterial);
router.get('/materials/:material_id', inventoryController.getInventoryByMaterialId);
router.get('/products', inventoryController.getInventoryByProduct);
router.get('/products/:product_id', inventoryController.getInventoryByProductId);
router.get('/semi-products', inventoryController.getInventoryBySemiProduct);
router.get('/warehouse/:warehouseId',  inventoryController.getInventoryByWarehouse);

module.exports = router;    