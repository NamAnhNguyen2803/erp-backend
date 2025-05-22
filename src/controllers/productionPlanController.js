const { ManufacturePlan, ManufacturingPlanDetail, Product, User } = require('../models');
const { Op } = require('sequelize');
const sequelize = require('../config/database');

// Get all production plans with pagination and filters
exports.getAllProductionPlans = async (req, res) => {
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
    
    // Find production plans with pagination
    const { count, rows } = await ManufacturePlan.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset: parseInt(offset),
      include: [
        {
          model: User,
          attributes: ['user_id', 'username'],
          as: 'Creator'
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
    console.error('Error getting production plans:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// Get production plan by ID with details
exports.getProductionPlanById = async (req, res) => {
  try {
    const { plan_id } = req.params;
    const plan = await ManufacturePlan.findByPk(plan_id, {
      include: [
        {
          model: User,
          attributes: ['user_id', 'username'],
          as: 'Creator'
        }
      ]
    });
    
    if (!plan) {
      return res.status(404).json({ message: 'Production plan not found' });
    }
    
    // Get plan details
    const planDetails = await ManufacturingPlanDetail.findAll({
      where: { plan_id },
      include: [
        {
          model: Product,
          attributes: ['product_id', 'code', 'name', 'unit']
        }
      ],
      order: [['detail_id', 'ASC']]
    });
    
    // Combine plan with its details
    const result = plan.toJSON();
    result.details = planDetails;
    
    return res.status(200).json(result);
  } catch (error) {
    console.error('Error getting production plan:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// Create new production plan with details
exports.createProductionPlan = async (req, res) => {
  // Transaction to ensure data consistency
  const t = await sequelize.transaction();
  
  try {
    const { plan_code, description, start_date, end_date, status, created_by, details } = req.body;
    
    // Validate user_id (created_by)
    const user = await User.findByPk(created_by);
    if (!user) {
      await t.rollback();
      return res.status(400).json({ message: 'Invalid created_by user_id' });
    }
    
    // Check if plan_code already exists
    const existingPlan = await ManufacturePlan.findOne({
      where: { plan_code }
    });
    
    if (existingPlan) {
      await t.rollback();
      return res.status(400).json({ message: 'Plan code already exists' });
    }
    
    // Create new production plan
    const newPlan = await ManufacturePlan.create({
      plan_code,
      description,
      start_date: start_date ? new Date(start_date) : null,
      end_date: end_date ? new Date(end_date) : null,
      status,
      created_by
    }, { transaction: t });
    
    // Create plan details if provided
    if (details && Array.isArray(details) && details.length > 0) {
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
        plan_id: newPlan.plan_id,
        product_id: detail.product_id,
        quantity: detail.quantity,
        planned_start_date: detail.planned_start_date ? new Date(detail.planned_start_date) : null,
        planned_end_date: detail.planned_end_date ? new Date(detail.planned_end_date) : null
      }));
      
      await ManufacturingPlanDetail.bulkCreate(planDetails, { transaction: t });
    }
    
    await t.commit();
    
    // Get the created plan with details
    const createdPlan = await ManufacturePlan.findByPk(newPlan.plan_id, {
      include: [
        {
          model: User,
          attributes: ['user_id', 'username'],
          as: 'Creator'
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
  } catch (error) {
    await t.rollback();
    console.error('Error creating production plan:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// Update production plan
exports.updateProductionPlan = async (req, res) => {
  // Transaction to ensure data consistency
  const t = await sequelize.transaction();
  
  try {
    const { plan_id } = req.params;
    const { plan_code, description, start_date, end_date, status, details } = req.body;
    
    // Find plan by ID
    const plan = await ManufacturePlan.findByPk(plan_id);
    if (!plan) {
      await t.rollback();
      return res.status(404).json({ message: 'Production plan not found' });
    }
    
    // Check if plan_code already exists (if changing)
    if (plan_code && plan_code !== plan.plan_code) {
      const existingPlan = await ManufacturePlan.findOne({
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
    const updatedPlan = await ManufacturePlan.findByPk(plan_id, {
      include: [
        {
          model: User,
          attributes: ['user_id', 'username'],
          as: 'Creator'
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
    await t.rollback();
    console.error('Error updating production plan:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}; 