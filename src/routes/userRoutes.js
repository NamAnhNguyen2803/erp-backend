const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
// Comment tạm thời middleware xác thực
// const { authenticateUser, authorizeAdmin } = require('../middleware/authMiddleware');

// Routes đã bỏ middleware xác thực để test
// GET /api/v1/users - Get all users
router.get('/', userController.getAllUsers);

// GET /api/v1/users/:user_id - Get user by ID
router.get('/:user_id', userController.getUserById);

// POST /api/v1/users - Create a new user
router.post('/', userController.createUser);

// PUT /api/v1/users/:user_id - Update user
router.put('/:user_id', userController.updateUser);

// DELETE /api/v1/users/:user_id - Delete user
router.delete('/:user_id', userController.deleteUser);

module.exports = router; 