const express = require('express');
const router = express.Router();
const MaterialStatusController = require('../controllers/materialStatusController');

// GET /api/material-status - Lấy danh sách material status với pagination
router.get('/', MaterialStatusController.getAllMaterialStatus);

// GET /api/material-status/:id - Lấy material status theo ID
router.get('/:id', MaterialStatusController.getMaterialStatusById);

// POST /api/material-status/generate/:work_id - Tự động tạo material status cho work order
router.post('/generate/:work_id', async (req, res) => {
  try {
    const { work_id } = req.params;
    const result = await MaterialStatusController.generateMaterialStatus(work_id);
    return res.status(201).json({ 
      message: 'Đã tạo material status thành công',
      ...result 
    });
  } catch (error) {
    console.error('Error generating material status:', error);
    return res.status(500).json({ message: error.message || 'Internal server error' });
  }
});

// PUT /api/material-status/refresh/:work_id - Cập nhật trạng thái từ kho
router.put('/refresh/:work_id', MaterialStatusController.refreshMaterialStatus);

// POST /api/material-status/allocate/:work_id - Phân bổ nguyên vật liệu
router.post('/allocate/:work_id', MaterialStatusController.allocateMaterials);

// POST /api/material-status/consume/:work_id - Ghi nhận tiêu thụ nguyên vật liệu
router.post('/consume/:work_id', MaterialStatusController.consumeMaterials);

// GET /api/material-status/summary/report - Báo cáo tổng hợp
router.get('/summary/report', MaterialStatusController.getMaterialStatusSummary);

module.exports = router;