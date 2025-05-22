const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
// Comment tạm thời middleware xác thực
// const { authenticateUser, authorizeManager } = require('../middleware/authMiddleware');

// GET /api/v1/products - Get all products
router.get('/', productController.getAllProducts);

// GET /api/v1/products/:product_id - Get product by ID
router.get('/:product_id', productController.getProductById);

// POST /api/v1/products - Create a new product
router.post('/', productController.createProduct);

// PUT /api/v1/products/:product_id - Update product
router.put('/:product_id', productController.updateProduct);

// DELETE /api/v1/products/:product_id - Delete product
router.delete('/:product_id', productController.deleteProduct);

module.exports = router; 