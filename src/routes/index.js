const express = require('express');
const router = express.Router();

// Import các routes
const userRoutes = require('./userRoutes');
const productRoutes = require('./productRoutes');
const materialRoutes = require('./materialRoutes');
const semiFinishedProductRoutes = require('./semiFinishedProductRoutes');
const warehouseRoutes = require('./warehouseRoutes');
const inventoryRoutes = require('./inventoryRoutes');
const bomRoutes = require('./bomRoutes');
const manufacturingPlanRoutes = require('./manufacturingPlanRoutes');
const manufacturingOrderRoutes = require('./manufacturingOrderRoutes');
const workOrderRoutes = require('./workOrderRoutes');
const materialStatusRoutes = require('./materialStatusRoutes');
const inventoryTransactionRoutes = require('./inventoryTransactionRoutes');
const manufacturingCostRoutes = require('./manufacturingCostRoutes');
const manufacturingLogRoutes = require('./manufacturingLogRoutes');
 // Đường dẫn cho ManufacturingOrderDetail
const manufacturingOrderDetailRoutes = require('./manufacturingOrderDetailRoutes');
// Thêm các route khác ở đây khi cần

// API v1 routes
router.use('/api/v1/users', userRoutes);
router.use('/api/v1/products', productRoutes);
router.use('/api/v1/materials', materialRoutes);
router.use('/api/v1/semi-finished-products', semiFinishedProductRoutes);
router.use('/api/v1/warehouses', warehouseRoutes);
router.use('/api/v1/inventory', inventoryRoutes);
router.use('/api/v1/boms', bomRoutes);
router.use('/api/v1/plans', manufacturingPlanRoutes);
router.use('/api/v1/orders', manufacturingOrderRoutes);
router.use('/api/v1/order-details', manufacturingOrderDetailRoutes ); 
router.use('/api/v1/work-orders', workOrderRoutes);
router.use('/api/v1/material-status', materialStatusRoutes);
router.use('/api/v1/transactions', inventoryTransactionRoutes);
router.use('/api/v1/manufacturing-costs', manufacturingCostRoutes);
router.use('/api/v1/manufacturing-logs', manufacturingLogRoutes);
// Thêm các route khác ở đây khi cần

module.exports = router; 