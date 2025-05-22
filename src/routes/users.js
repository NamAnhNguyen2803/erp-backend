const express = require('express');
const router = express.Router();
const {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser
} = require('../controllers/userController');
const { auth, isAdmin, isSelfOrAdmin } = require('../middleware/auth');

// All routes require authentication
router.use(auth);

// Admin only routes
router.get('/', isAdmin, getUsers);
router.post('/', isAdmin, createUser);

// Self or admin routes
router.get('/:id', isSelfOrAdmin, getUserById);
router.put('/:id', isSelfOrAdmin, updateUser);
router.delete('/:id', isAdmin, deleteUser);

module.exports = router; 