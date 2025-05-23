const express = require('express');
const router = express.Router();
const materialController = require('../controllers/materialController');
// Comment tạm thời middleware xác thực
// const { authenticateUser, authorizeManager } = require('../middleware/authMiddleware');
console.log('Loaded controller:', materialController);

// GET /api/v1/materials - Get all materials
router.get('/', materialController.getAllMaterials);

// GET /api/v1/materials/:material_id - Get material by ID
router.get('/:material_id', materialController.getMaterialById);

// POST /api/v1/materials - Create a new material
router.post('/', materialController.createMaterial);

// PUT /api/v1/materials/:material_id - Update material
router.put('/:material_id', materialController.updateMaterial);

// DELETE /api/v1/materials/:material_id - Delete material
router.delete('/:material_id', materialController.deleteMaterial);

module.exports = router; 