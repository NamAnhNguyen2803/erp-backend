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
const productionPlanRoutes = require('./productionPlanRoutes');
const productionOrderRoutes = require('./productionOrderRoutes');
const workOrderRoutes = require('./workOrderRoutes');
const materialRequirementRoutes = require('./materialRequirementRoutes');
const inventoryTransactionRoutes = require('./inventoryTransactionRoutes');
const productionCostRoutes = require('./productionCostRoutes');
const productionLogRoutes = require('./productionLogRoutes');
// Thêm các route khác ở đây khi cần

// API v1 routes
router.use('/api/v1/users', userRoutes);
router.use('/api/v1/products', productRoutes);
router.use('/api/v1/materials', materialRoutes);
router.use('/api/v1/semi-finished-products', semiFinishedProductRoutes);
router.use('/api/v1/warehouses', warehouseRoutes);
router.use('/api/v1/inventory', inventoryRoutes);
router.use('/api/v1/boms', bomRoutes);
router.use('/api/v1/production-plans', productionPlanRoutes);
router.use('/api/v1/production-orders', productionOrderRoutes);
router.use('/api/v1/work-orders', workOrderRoutes);
router.use('/api/v1/material-requirements', materialRequirementRoutes);
router.use('/api/v1/inventory-transactions', inventoryTransactionRoutes);
router.use('/api/v1/production-costs', productionCostRoutes);
router.use('/api/v1/production-logs', productionLogRoutes);
// Thêm các route khác ở đây khi cần

module.exports = router; 