const express = require('express');
const router = express.Router();
const bomController = require('../controllers/bomController');
// Comment tạm thời middleware xác thực
// const { authenticateUser, authorizeManager } = require('../middleware/authMiddleware');

// GET /api/v1/boms - Get all BOMs
router.get('/', bomController.getAllBoms);

// GET /api/v1/boms/:bom_id - Get BOM by ID with items
router.get('/:bom_id', bomController.getBomById);

// POST /api/v1/boms - Create a new BOM
router.post('/', bomController.createBom);

// PUT /api/v1/boms/:bom_id - Update BOM
router.put('/:bom_id', bomController.updateBom);

module.exports = router; 