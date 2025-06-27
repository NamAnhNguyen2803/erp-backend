// src/routes/bomItemRoutes.js

const express = require('express');
const router = express.Router();
const bomItemController = require('../controllers/bomItemController');


// GET /api/v1/bom-items - Lấy tất cả các bản ghi BOMItem
router.get('/', bomItemController.getBOMItems);
// POST /api/v1/bom-items - Tạo mới một bản ghi BOMItem
router.post('/', bomItemController.createBomItem);



// PUT /api/v1/bom-items/:item_id - Cập nhật một bản ghi BOMItem
router.put('/:item_id', bomItemController.updateBOMItem);

// DELETE /api/v1/bom-items/:item_id - Xóa một bản ghi BOMItem
router.delete('/:item_id', bomItemController.deleteBOMItem);

module.exports = router; 