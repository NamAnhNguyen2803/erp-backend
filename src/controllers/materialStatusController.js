const { MaterialStatus, WorkOrder, Material, MaterialInventory, Warehouse, BOMItem, SemiBOMItem, ManufacturingOrderDetail, BOM, SemiBOM } = require('../models');
const { Op } = require('sequelize');
const sequelize = require('../config/database');

// Tự động tạo material status khi tạo work order
exports.generateMaterialStatus = async (workId) => {
    const transaction = await sequelize.transaction();

    try {
        // Lấy thông tin work order và detail
        const workOrder = await WorkOrder.findOne({
            where: { work_id: workId },
            include: [
                {
                    model: ManufacturingOrderDetail,
                    attributes: ['item_id', 'item_type', 'bom_id', 'semi_bom_id']
                }
            ],
            transaction
        });
        console.log('workOrder:', workOrder);
        console.log('detail:', workOrder.ManufacturingOrderDetail);

        if (!workOrder) {
            throw new Error('Work order không tồn tại');
        }

        const detail = workOrder.ManufacturingOrderDetail;

        // Xóa material status cũ nếu có
        await MaterialStatus.destroy({
            where: { work_id: workId },
            transaction
        });

        let bomItems = [];

        // Lấy BOM items dựa trên loại sản phẩm
        if (detail.item_type === 'product' && detail.bom_id) {
            bomItems = await BOMItem.findAll({
                where: {
                    bom_id: detail.bom_id,
                    item_type: 'material'
                },
                transaction
            });
        } else if (detail.item_type === 'semi_product' && detail.semi_bom_id) {
            bomItems = await SemiBOMItem.findAll({
                where: {
                    semi_bom_id: detail.semi_bom_id,
                    item_type: 'material'
                },
                transaction
            });
        }

        // Tạo material status cho từng nguyên vật liệu
        const materialStatusData = [];

        for (const item of bomItems) {
            const materialId = detail.item_type === 'product' ? item.material_id : item.item_id_ref;

            // Tính số lượng cần thiết
            let requiredQty = parseFloat(item.quantity) * parseFloat(workOrder.work_quantity);
            requiredQty += requiredQty * (parseFloat(item.waste_percent || 0) / 100); // Cộng phần trăm hao hụt

            // Lấy số lượng có sẵn trong kho 2000 (nguyên vật liệu)
            const inventory = await MaterialInventory.findOne({
                include: [
                    {
                        model: Warehouse,
                        where: { code: '2000' } // Kho nguyên vật liệu
                    }
                ],
                where: { material_id: materialId },
                transaction
            });

            const availableQty = inventory ? parseFloat(inventory.quantity) : 0;
            const shortageQty = Math.max(0, requiredQty - availableQty);

            // Xác định trạng thái
            let status = 'pending';
            if (availableQty >= requiredQty) {
                status = 'ready';
            } else if (availableQty > 0) {
                status = 'partial';
            }

            // Lấy thông tin material để có unit
            const material = await Material.findByPk(materialId, { transaction });

            materialStatusData.push({
                work_id: workId,
                material_id: materialId,
                required_qty: requiredQty,
                available_qty: availableQty,
                allocated_qty: 0,
                consumed_qty: 0,
                unit: material ? material.unit : 'pcs',
                status: status,
                shortage_qty: shortageQty,
                last_checked: new Date()
            });
        }

        // Bulk insert material status
        if (materialStatusData.length > 0) {
            await MaterialStatus.bulkCreate(materialStatusData, { transaction });
        }

        await transaction.commit();
        return { success: true, count: materialStatusData.length };

    } catch (error) {
        await transaction.rollback();
        throw error;
    }
};

// Get all material status với pagination và filters
exports.getAllMaterialStatus = async (req, res) => {
    try {
        const { page = 1, limit = 10, work_id, status, material_id } = req.query;
        const offset = (page - 1) * limit;

        // Build filter condition
        const where = {};
        if (work_id) where.work_id = work_id;
        if (status) where.status = status;
        if (material_id) where.material_id = material_id;

        const { count, rows } = await MaterialStatus.findAndCountAll({
            where,
            limit: parseInt(limit),
            offset: parseInt(offset),
            include: [
                {
                    model: WorkOrder,
                    attributes: ['work_id', 'work_code', 'order_id', 'status', 'work_quantity'],
                    include: [
                        {
                            model: ManufacturingOrderDetail,
                            attributes: ['detail_id', 'item_type', 'quantity']
                        }
                    ]
                },
                {
                    model: Material,
                    attributes: ['material_id', 'code', 'name', 'unit']
                }
            ],
            order: [['status_id', 'DESC']]
        });

        return res.status(200).json({
            materialStatus: rows,
            total: count,
            page: parseInt(page),
            limit: parseInt(limit)
        });
    } catch (error) {
        console.error('Error getting material status:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

// Cập nhật trạng thái material status (kiểm tra lại kho)
exports.refreshMaterialStatus = async (req, res) => {
    try {
        const { work_id } = req.params;

        const materialStatuses = await MaterialStatus.findAll({
            where: { work_id: work_id }
        });

        for (const materialStatus of materialStatuses) {
            // Cập nhật số lượng có sẵn từ kho
            const inventory = await MaterialInventory.findOne({
                include: [
                    {
                        model: Warehouse,
                        where: { code: '2000' }
                    }
                ],
                where: { material_id: materialStatus.material_id }
            });

            const availableQty = inventory ? parseFloat(inventory.quantity) : 0;
            const shortageQty = Math.max(0, parseFloat(materialStatus.required_qty) - availableQty);

            // Xác định trạng thái mới
            let status = materialStatus.status;
            if (status === 'pending' || status === 'ready' || status === 'partial') {
                if (availableQty >= parseFloat(materialStatus.required_qty)) {
                    status = 'ready';
                } else if (availableQty > 0) {
                    status = 'partial';
                } else {
                    status = 'pending';
                }
            }

            await materialStatus.update({
                available_qty: availableQty,
                shortage_qty: shortageQty,
                status: status,
                last_checked: new Date()
            });
        }

        return res.status(200).json({
            message: 'Đã cập nhật trạng thái material status',
            work_id: work_id
        });
    } catch (error) {
        console.error('Error refreshing material status:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

// Phân bổ nguyên vật liệu cho work order
exports.allocateMaterials = async (req, res) => {
    const transaction = await sequelize.transaction();

    try {
        const { work_id } = req.params;
        const { allocations } = req.body; // [{ material_id, allocated_qty }]

        for (const allocation of allocations) {
            const materialStatus = await MaterialStatus.findOne({
                where: {
                    work_id: work_id,
                    material_id: allocation.material_id
                },
                transaction
            });

            if (!materialStatus) {
                throw new Error(`Material status không tồn tại cho material ${allocation.material_id}`);
            }

            // Cập nhật allocated_qty và status
            await materialStatus.update({
                allocated_qty: allocation.allocated_qty,
                status: 'allocated'
            }, { transaction });
        }

        await transaction.commit();
        return res.status(200).json({
            message: 'Đã phân bổ nguyên vật liệu thành công',
            work_id: work_id
        });

    } catch (error) {
        await transaction.rollback();
        console.error('Error allocating materials:', error);
        return res.status(500).json({ message: error.message || 'Internal server error' });
    }
};

// Ghi nhận tiêu thụ nguyên vật liệu
exports.consumeMaterials = async (req, res) => {
    const transaction = await sequelize.transaction();

    try {
        const { work_id } = req.params;
        const { consumptions } = req.body; // [{ material_id, consumed_qty }]

        for (const consumption of consumptions) {
            const materialStatus = await MaterialStatus.findOne({
                where: {
                    work_id: work_id,
                    material_id: consumption.material_id
                },
                transaction
            });

            if (!materialStatus) {
                throw new Error(`Material status không tồn tại cho material ${consumption.material_id}`);
            }

            // Cập nhật consumed_qty và status
            await materialStatus.update({
                consumed_qty: parseFloat(materialStatus.consumed_qty) + parseFloat(consumption.consumed_qty),
                status: 'consumed'
            }, { transaction });
        }

        await transaction.commit();
        return res.status(200).json({
            message: 'Đã ghi nhận tiêu thụ nguyên vật liệu',
            work_id: work_id
        });

    } catch (error) {
        await transaction.rollback();
        console.error('Error consuming materials:', error);
        return res.status(500).json({ message: error.message || 'Internal server error' });
    }
};

// Lấy báo cáo tổng hợp material status
exports.getMaterialStatusSummary = async (req, res) => {
    try {
        const { order_id } = req.query;

        const where = {};
        const workOrderWhere = {};
        if (order_id) workOrderWhere.order_id = order_id;

        const summary = await MaterialStatus.findAll({
            attributes: [
                'status',
                [sequelize.fn('COUNT', sequelize.col('MaterialStatus.status_id')), 'count'],
                [sequelize.fn('SUM', sequelize.col('shortage_qty')), 'total_shortage']
            ],
            include: [
                {
                    model: WorkOrder,
                    attributes: [],
                    where: workOrderWhere
                }
            ],
            group: ['status'],
            raw: true
        });

        return res.status(200).json({ summary });
    } catch (error) {
        console.error('Error getting material status summary:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

exports.getMaterialStatusById = async (req, res) => {
    try {
        const { id } = req.params;

        const materialStatus = await MaterialStatus.findByPk(id, {
            include: [
                {
                    model: WorkOrder,
                    attributes: ['work_id', 'work_code', 'order_id', 'status', 'work_quantity', 'process_step'],
                    include: [
                        {
                            model: ManufacturingOrderDetail,
                            attributes: ['detail_id', 'item_type', 'quantity', 'bom_id', 'semi_bom_id']
                        }
                    ]
                },
                {
                    model: Material,
                    attributes: ['material_id', 'code', 'name', 'unit', 'specification', 'supplier']
                }
            ]
        });

        if (!materialStatus) {
            return res.status(404).json({ message: 'Material status không tồn tại' });
        }

        return res.status(200).json({ materialStatus });
    } catch (error) {
        console.error('Error getting material status by ID:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

// Lấy báo cáo tổng hợp material status
exports.getMaterialStatusSummary = async (req, res) => {
    try {
        const { order_id } = req.query;

        const where = {};
        const workOrderWhere = {};
        if (order_id) workOrderWhere.order_id = order_id;

        const summary = await MaterialStatus.findAll({
            attributes: [
                'status',
                [sequelize.fn('COUNT', sequelize.col('MaterialStatus.status_id')), 'count'],
                [sequelize.fn('SUM', sequelize.col('shortage_qty')), 'total_shortage']
            ],
            include: [
                {
                    model: WorkOrder,
                    attributes: [],
                    where: workOrderWhere
                }
            ],
            group: ['status'],
            raw: true
        });

        return res.status(200).json({ summary });
    } catch (error) {
        console.error('Error getting material status summary:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};