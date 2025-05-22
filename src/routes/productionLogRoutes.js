const express = require('express');
const router = express.Router();
const productionLogController = require('../controllers/productionLogController');
// Comment tạm thời middleware xác thực
// const { authenticateUser, authorizeManager } = require('../middleware/authMiddleware');

// GET /api/v1/production-logs - Get all production logs
router.get('/', productionLogController.getAllProductionLogs);

// POST /api/v1/production-logs - Create a new production log
router.post('/', productionLogController.createProductionLog);

module.exports = router; 