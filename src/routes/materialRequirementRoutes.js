const express = require('express');
const router = express.Router();
const materialRequirementController = require('../controllers/materialRequirementController');
// Comment tạm thời middleware xác thực
// const { authenticateUser, authorizeManager } = require('../middleware/authMiddleware');

// GET /api/v1/material-requirements - Get all material requirements
router.get('/', materialRequirementController.getAllMaterialRequirements);

// POST /api/v1/material-requirements - Create a new material requirement
router.post('/', materialRequirementController.createMaterialRequirement);

// PUT /api/v1/material-requirements/:requirement_id - Update material requirement
router.put('/:requirement_id', materialRequirementController.updateMaterialRequirement);

module.exports = router; 