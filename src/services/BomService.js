const { Op } = require('sequelize');
const SemiBom = require('../models/SemiBom');
const SemiBomItem = require('../models/SemiBomItem');
const Material = require('../models/Material');
const SemiFinishedProduct = require('../models/SemiFinishedProduct');
const InventoryService = require('./InventoryService');

class BomService {
  async createBom(params) {
    const {
      semiProductId,
      name,
      description,
      version,
      items
    } = params;

    const transaction = await sequelize.transaction();

    try {
      // Create BOM
      const bom = await SemiBom.create({
        semi_product_id: semiProductId,
        name,
        description,
        version
      }, { transaction });

      // Create BOM items
      const bomItems = await Promise.all(
        items.map(item => 
          SemiBomItem.create({
            semi_bom_id: bom.id,
            item_id: item.itemId,
            item_type: item.itemType,
            quantity: item.quantity,
            unit: item.unit
          }, { transaction })
        )
      );

      await transaction.commit();
      return { bom, items: bomItems };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async updateBom(bomId, params) {
    const {
      name,
      description,
      version,
      items,
      isActive
    } = params;

    const transaction = await sequelize.transaction();

    try {
      // Update BOM
      const bom = await SemiBom.findByPk(bomId, { transaction });
      if (!bom) {
        throw new Error('BOM not found');
      }

      await bom.update({
        name,
        description,
        version,
        is_active: isActive
      }, { transaction });

      // Update BOM items
      if (items) {
        // Delete existing items
        await SemiBomItem.destroy({
          where: { semi_bom_id: bomId },
          transaction
        });

        // Create new items
        await Promise.all(
          items.map(item =>
            SemiBomItem.create({
              semi_bom_id: bomId,
              item_id: item.itemId,
              item_type: item.itemType,
              quantity: item.quantity,
              unit: item.unit
            }, { transaction })
          )
        );
      }

      await transaction.commit();
      return bom;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async calculateMaterials(bomId, quantity) {
    const transaction = await sequelize.transaction();

    try {
      const bom = await SemiBom.findByPk(bomId, {
        include: [{
          model: SemiBomItem,
          as: 'items',
          include: [
            {
              model: Material,
              as: 'material'
            },
            {
              model: SemiFinishedProduct,
              as: 'semiProduct'
            }
          ]
        }],
        transaction
      });

      if (!bom) {
        throw new Error('BOM not found');
      }

      const materialRequirements = new Map();

      // Process each BOM item
      for (const item of bom.items) {
        const itemQuantity = item.quantity * quantity;

        if (item.item_type === 'material') {
          // Add material requirement
          const key = `${item.item_id}-${item.unit}`;
          materialRequirements.set(key, {
            materialId: item.item_id,
            materialName: item.material.name,
            unit: item.unit,
            quantity: (materialRequirements.get(key)?.quantity || 0) + itemQuantity
          });
        } else if (item.item_type === 'semi_product') {
          // Recursively calculate materials for nested BOM
          const nestedBom = await SemiBom.findOne({
            where: {
              semi_product_id: item.item_id,
              is_active: true
            },
            transaction
          });

          if (!nestedBom) {
            throw new Error(`No active BOM found for semi-product ${item.semiProduct.name}`);
          }

          const nestedRequirements = await this.calculateMaterials(nestedBom.id, itemQuantity);
          
          // Merge nested requirements
          for (const [key, value] of nestedRequirements.entries()) {
            const existing = materialRequirements.get(key);
            if (existing) {
              existing.quantity += value.quantity;
            } else {
              materialRequirements.set(key, value);
            }
          }
        }
      }

      await transaction.commit();
      return materialRequirements;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async produce(bomId, params) {
    const {
      quantity,
      warehouseId,
      referenceType,
      referenceId,
      notes
    } = params;

    const transaction = await sequelize.transaction();

    try {
      // Calculate material requirements
      const materialRequirements = await this.calculateMaterials(bomId, quantity);

      // Check material availability
      for (const [_, requirement] of materialRequirements) {
        const inventory = await InventoryService.getInventoryByItem(
          requirement.materialId,
          'material',
          warehouseId
        );

        if (!inventory || inventory.quantity < requirement.quantity) {
          throw new Error(`Insufficient material: ${requirement.materialName}`);
        }
      }

      // Consume materials
      for (const [_, requirement] of materialRequirements) {
        await InventoryService.consumeInventory({
          itemId: requirement.materialId,
          itemType: 'material',
          warehouseId,
          quantity: requirement.quantity,
          referenceType,
          referenceId,
          notes: `Consumed for BOM ${bomId} production`
        });
      }

      // Get BOM details
      const bom = await SemiBom.findByPk(bomId, {
        include: [{
          model: SemiFinishedProduct,
          as: 'semiProduct'
        }],
        transaction
      });

      // Produce semi-finished product
      await InventoryService.produceInventory({
        itemId: bom.semi_product_id,
        itemType: 'semi_product',
        warehouseId,
        quantity,
        unit: bom.semiProduct.unit,
        referenceType,
        referenceId,
        notes
      });

      await transaction.commit();
      return true;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
}

module.exports = new BomService(); 