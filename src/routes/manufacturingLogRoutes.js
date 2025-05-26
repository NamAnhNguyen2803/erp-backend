const express = require('express');
const router = express.Router();
const manufacturingLogController = require('../controllers/manufacturingLogController');
// Comment tạm thời middleware xác thực
// const { authenticateUser, authorizeManager } = require('../middleware/authMiddleware');

// GET /api/v1/manufacturing-logs - Get all manufacturing logs
router.get('/', manufacturingLogController.getAllManufacturingLogs);

// POST /api/v1/manufacturing-logs - Create a new manufacturing log
router.post('/', manufacturingLogController.createManufacturingLog);

module.exports = router; 