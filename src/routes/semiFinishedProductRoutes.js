const express = require('express');
const router = express.Router();
const semiFinishedProductController = require('../controllers/semiFinishedProductController');
// Comment tạm thời middleware xác thực
// const { authenticateUser, authorizeManager } = require('../middleware/authMiddleware');

// GET /api/v1/semi-products - Get all semi products
router.get('/', semiFinishedProductController.getAllSemiFinishedProducts);

// GET /api/v1/semi-products/:semi_product_id - Get semi product by ID
router.get('/:semi_product_id', semiFinishedProductController.getSemiFinishedProductById);

// POST /api/v1/semi-products - Create a new semi product
router.post('/', semiFinishedProductController.createSemiFinishedProduct);

// PUT /api/v1/semi-products/:semi_product_id - Update semi product
router.put('/:semi_product_id', semiFinishedProductController.updateSemiFinishedProduct);

// DELETE /api/v1/semi-products/:semi_product_id - Delete semi product
router.delete('/:semi_product_id', semiFinishedProductController.deleteSemiFinishedProduct);

module.exports = router; 