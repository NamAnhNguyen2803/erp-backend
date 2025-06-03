const { ManufacturingPlan, ManufacturingPlanDetail, Product, User, BOM} = require('../models');
const { Op } = require('sequelize');
const sequelize = require('../config/database');

// Get all Manufacturing plans with pagination and filters
exports.getAllManufacturingPlans = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, start_date, end_date } = req.query;
    const offset = (page - 1) * limit;

    // Build filter condition
    const where = {};
    if (status) where.status = status;

    // Date filters
    if (start_date && end_date) {
      where.createdAt = {
        [Op.between]: [new Date(start_date), new Date(end_date)]
      };
    } else if (start_date) {
      where.createdAt = {
        [Op.gte]: new Date(start_date)
      };
    } else if (end_date) {
      where.createdAt = {
        [Op.lte]: new Date(end_date)
      };
    }

    // Find Manufacturing plans with pagination
    const { count, rows } = await ManufacturingPlan.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset: parseInt(offset),
      include: [
        {
          model: User,
          attributes: ['user_id', 'username']
        }
      ],
      order: [['plan_id', 'DESC']]
    });

    return res.status(200).json({
      plans: rows,
      total: count,
      page: parseInt(page),
      limit: parseInt(limit)
    });
  } catch (error) {
    console.error('Error getting Manufacturing plans:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// Get Manufacturing plan by ID with details
exports.getManufacturingPlanById = async (req, res) => {
  try {
    const { plan_id } = req.params;
    const plan = await ManufacturingPlan.findByPk(plan_id, {
      include: [
        {
          model: User,
          attributes: ['user_id', 'username'],
          // as: 'Creator'
        }
      ]
    });

    if (!plan) {
      return res.status(404).json({ message: 'Manufacturing plan not found' });
    }

    // Get plan details
    const planDetails = await ManufacturingPlanDetail.findAll({
      where: { plan_id },
      include: [
        {
          model: Product,
          attributes: ['product_id', 'code', 'name', 'unit'],
          include: [
          {
            model: BOM, 
            attributes: ['bom_id', 'version'],
            required: false
          }
        ]
        },
      ],
      order: [['detail_id', 'ASC']]
    });

    // Combine plan with its details
    const result = plan.toJSON();
    result.details = planDetails;

    return res.status(200).json(result);
  } catch (error) {

    console.error('Error getting Manufacturing plan:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

exports.createManufacturingPlan = async (req, res) => {
  const t = await sequelize.transaction();
  let newPlan;

  try {
    const { plan_code, description, start_date, end_date, status, created_by, details } = req.body;

    const user = await User.findByPk(created_by);
    if (!user) {
      await t.rollback();
      return res.status(400).json({ message: 'Invalid created_by user_id' });
    }

    const existingPlan = await ManufacturingPlan.findOne({ where: { plan_code } });
    if (existingPlan) {
      await t.rollback();
      return res.status(400).json({ message: 'Plan code already exists' });
    }

    newPlan = await ManufacturingPlan.create({
      plan_code,
      description,
      start_date: start_date ? new Date(start_date) : null,
      end_date: end_date ? new Date(end_date) : null,
      status,
      created_by
    }, { transaction: t });

    if (details && Array.isArray(details) && details.length > 0) {
      for (const detail of details) {
        const product = await Product.findByPk(detail.product_id);
        if (!product) {
          await t.rollback();
          return res.status(400).json({ message: `Invalid product_id: ${detail.product_id}` });
        }
      }

      const planDetails = details.map(detail => ({
        plan_id: newPlan.plan_id,
        product_id: detail.product_id,
        quantity: detail.quantity,
        planned_start_date: detail.planned_start_date ? new Date(detail.planned_start_date) : null,
        planned_end_date: detail.planned_end_date ? new Date(detail.planned_end_date) : null
      }));

      await ManufacturingPlanDetail.bulkCreate(planDetails, { transaction: t });
    }

    await t.commit();
  } catch (error) {
    if (!t.finished) {
      await t.rollback();
    }
    console.error('Error creating Manufacturing plan:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }

  // ✅ Lúc này newPlan vẫn tồn tại
  try {
    const createdPlan = await ManufacturingPlan.findByPk(newPlan.plan_id, {
      include: [
        {
          model: User,
          attributes: ['user_id', 'username'],
          // as: 'Creator'
        },
        {
          model: ManufacturingPlanDetail,
          include: [
            {
              model: Product,
              attributes: ['product_id', 'code', 'name', 'unit']
            }
          ]
        }
      ]
    });

    return res.status(201).json(createdPlan);
  } catch (postQueryError) {
    console.error('Error fetching created plan:', postQueryError);
    return res.status(201).json({ message: 'Plan created but failed to fetch details' });
  }
};



// Update Manufacturing plan
exports.updateManufacturingPlan = async (req, res) => {
  // Transaction to ensure data consistency
  const t = await sequelize.transaction();

  try {
    const { plan_id } = req.params;
    const { plan_code, description, start_date, end_date, status, details } = req.body;

    // Find plan by ID
    const plan = await ManufacturingPlan.findByPk(plan_id);
    if (!plan) {
      await t.rollback();
      return res.status(404).json({ message: 'Manufacturing plan not found' });
    }

    // Check if plan_code already exists (if changing)
    if (plan_code && plan_code !== plan.plan_code) {
      const existingPlan = await ManufacturingPlan.findOne({
        where: {
          plan_code,
          plan_id: { [Op.ne]: plan_id }
        }
      });

      if (existingPlan) {
        await t.rollback();
        return res.status(400).json({ message: 'Plan code already exists' });
      }
    }

    // Update plan fields
    await plan.update({
      plan_code: plan_code || plan.plan_code,
      description: description !== undefined ? description : plan.description,
      start_date: start_date ? new Date(start_date) : plan.start_date,
      end_date: end_date ? new Date(end_date) : plan.end_date,
      status: status || plan.status
    }, { transaction: t });

    // Update details if provided
    if (details && Array.isArray(details)) {
      // First, delete existing details
      await ManufacturingPlanDetail.destroy({
        where: { plan_id },
        transaction: t
      });

      // Then create new details
      if (details.length > 0) {
        // Validate each product_id exists
        for (const detail of details) {
          const product = await Product.findByPk(detail.product_id);
          if (!product) {
            await t.rollback();
            return res.status(400).json({ message: `Invalid product_id: ${detail.product_id}` });
          }
        }

        // Create plan details
        const planDetails = details.map(detail => ({
          plan_id,
          product_id: detail.product_id,
          quantity: detail.quantity,
          planned_start_date: detail.planned_start_date ? new Date(detail.planned_start_date) : null,
          planned_end_date: detail.planned_end_date ? new Date(detail.planned_end_date) : null
        }));

        await ManufacturingPlanDetail.bulkCreate(planDetails, { transaction: t });
      }
    }


    await t.commit();

    // Get the updated plan with details
    const updatedPlan = await ManufacturingPlan.findByPk(plan_id, {
      include: [
        {
          model: User,
          attributes: ['user_id', 'username'],
          // as: 'Creator'
        },
        {
          model: ManufacturingPlanDetail,
          include: [
            {
              model: Product,
              attributes: ['product_id', 'code', 'name', 'unit']
            }
          ]
        }
      ]
    });

    return res.status(200).json(updatedPlan);
  } catch (error) {

    if (!t.finished) {  // chỉ rollback nếu transaction chưa kết thúc
      await t.rollback();
    }
    console.error('Error updating Manufacturing plan:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}; 