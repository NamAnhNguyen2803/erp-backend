const express = require('express');
const router = express.Router();
const semiFinishedProductController = require('../controllers/semiFinishedProductController');
// Comment tạm thời middleware xác thực
// const { authenticateUser, authorizeManager } = require('../middleware/authMiddleware');

// GET /api/v1/semi-finished-products - Get all semi-finished products
router.get('/', semiFinishedProductController.getAllSemiFinishedProducts);

// GET /api/v1/semi-finished-products/:semi_product_id - Get semi-finished product by ID
router.get('/:semi_product_id', semiFinishedProductController.getSemiFinishedProductById);

// POST /api/v1/semi-finished-products - Create a new semi-finished product
router.post('/', semiFinishedProductController.createSemiFinishedProduct);

// PUT /api/v1/semi-finished-products/:semi_product_id - Update semi-finished product
router.put('/:semi_product_id', semiFinishedProductController.updateSemiFinishedProduct);

// DELETE /api/v1/semi-finished-products/:semi_product_id - Delete semi-finished product
router.delete('/:semi_product_id', semiFinishedProductController.deleteSemiFinishedProduct);

module.exports = router; 