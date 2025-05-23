const BomService = require('../services/BomService');

class SemiBomController {
  async create(req, res) {
    try {
      const bom = await BomService.createBom(req.body);
      res.status(201).json(bom);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async update(req, res) {
    try {
      const bom = await BomService.updateBom(req.params.id, req.body);
      res.json(bom);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async getOne(req, res) {
    try {
      const bom = await BomService.getBomWithItems(req.params.id);
      res.json(bom);
    } catch (error) {
      res.status(404).json({ error: error.message });
    }
  }

  async produce(req, res) {
    try {
      const { quantity, warehouseId, referenceType, referenceId } = req.body;
      await BomService.produceFromBom(
        req.params.id,
        quantity,
        warehouseId,
        referenceType,
        referenceId
      );
      res.json({ message: 'Production completed successfully' });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async calculateMaterials(req, res) {
    try {
      const { quantity } = req.body;
      const materials = await BomService.calculateRequiredMaterials(
        req.params.id,
        quantity
      );
      res.json(materials);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }
}

module.exports = new SemiBomController(); 