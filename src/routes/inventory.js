const express = require('express');
const router = express.Router();
const InventoryController = require('../controllers/InventoryController');
const SemiBomController = require('../controllers/SemiBomController');
const { authenticate } = require('../middleware/auth');

// Stock operations
router.post('/stock-in', authenticate, InventoryController.stockIn);
router.post('/stock-out', authenticate, InventoryController.stockOut);

// Inventory queries
router.get('/summary', authenticate, InventoryController.getInventorySummary);
router.get('/item', authenticate, InventoryController.getInventoryByItem);

// Transfer operations
router.post('/transfer', authenticate, InventoryController.transferInventory);

// Production operations
router.post('/consume', authenticate, InventoryController.consumeInventory);
router.post('/produce', authenticate, InventoryController.produceInventory);

// BOM routes
router.post('/bom', SemiBomController.create);
router.put('/bom/:id', SemiBomController.update);
router.get('/bom/:id', SemiBomController.getOne);
router.post('/bom/:id/produce', SemiBomController.produce);
router.post('/bom/:id/calculate-materials', SemiBomController.calculateMaterials);

module.exports = router; 