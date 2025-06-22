# Details

Date : 2025-06-16 07:54:16

Directory d:\\document\\project\\finale\\erp-backend\\src

Total : 78 files,  6169 codes, 514 comments, 880 blanks, all 7563 lines

[Summary](results.md) / Details / [Diff Summary](diff.md) / [Diff Details](diff-details.md)

## Files
| filename | language | code | comment | blank | total |
| :--- | :--- | ---: | ---: | ---: | ---: |
| [src/config/config.js](/src/config/config.js) | JavaScript | 48 | 0 | 1 | 49 |
| [src/config/database.js](/src/config/database.js) | JavaScript | 30 | 3 | 4 | 37 |
| [src/config/db.js](/src/config/db.js) | JavaScript | 14 | 0 | 2 | 16 |
| [src/controllers/SemiBomController.js](/src/controllers/SemiBomController.js) | JavaScript | 55 | 0 | 6 | 61 |
| [src/controllers/authController.js](/src/controllers/authController.js) | JavaScript | 42 | 1 | 7 | 50 |
| [src/controllers/bomController.js](/src/controllers/bomController.js) | JavaScript | 263 | 34 | 53 | 350 |
| [src/controllers/exampleController.js](/src/controllers/exampleController.js) | JavaScript | 21 | 0 | 3 | 24 |
| [src/controllers/inventoryController.js](/src/controllers/inventoryController.js) | JavaScript | 107 | 4 | 6 | 117 |
| [src/controllers/inventoryTransactionController.js](/src/controllers/inventoryTransactionController.js) | JavaScript | 516 | 27 | 78 | 621 |
| [src/controllers/manufacturingCostController.js](/src/controllers/manufacturingCostController.js) | JavaScript | 89 | 11 | 14 | 114 |
| [src/controllers/manufacturingLogController.js](/src/controllers/manufacturingLogController.js) | JavaScript | 122 | 11 | 15 | 148 |
| [src/controllers/manufacturingOrderController.js](/src/controllers/manufacturingOrderController.js) | JavaScript | 212 | 25 | 37 | 274 |
| [src/controllers/manufacturingOrderDetailController.js](/src/controllers/manufacturingOrderDetailController.js) | JavaScript | 199 | 11 | 29 | 239 |
| [src/controllers/manufacturingPlanController.js](/src/controllers/manufacturingPlanController.js) | JavaScript | 235 | 22 | 39 | 296 |
| [src/controllers/materialController.js](/src/controllers/materialController.js) | JavaScript | 116 | 14 | 21 | 151 |
| [src/controllers/materialRequirementController.js](/src/controllers/materialRequirementController.js) | JavaScript | 126 | 15 | 21 | 162 |
| [src/controllers/materialStatusController.js](/src/controllers/materialStatusController.js) | JavaScript | 326 | 21 | 55 | 402 |
| [src/controllers/productController.js](/src/controllers/productController.js) | JavaScript | 105 | 5 | 20 | 130 |
| [src/controllers/semiFinishedProductController.js](/src/controllers/semiFinishedProductController.js) | JavaScript | 105 | 18 | 21 | 144 |
| [src/controllers/userController.js](/src/controllers/userController.js) | JavaScript | 111 | 14 | 21 | 146 |
| [src/controllers/warehouseController.js](/src/controllers/warehouseController.js) | JavaScript | 101 | 14 | 20 | 135 |
| [src/controllers/workOrderController.js](/src/controllers/workOrderController.js) | JavaScript | 552 | 64 | 96 | 712 |
| [src/helper/digitWorkCodeGenerator.js](/src/helper/digitWorkCodeGenerator.js) | JavaScript | 25 | 2 | 2 | 29 |
| [src/helper/inventoryHelper.js](/src/helper/inventoryHelper.js) | JavaScript | 43 | 4 | 6 | 53 |
| [src/middleware/auth.js](/src/middleware/auth.js) | JavaScript | 33 | 0 | 8 | 41 |
| [src/middleware/authMiddleware.js](/src/middleware/authMiddleware.js) | JavaScript | 43 | 8 | 8 | 59 |
| [src/migrations/20250522093713-create-manufacturing-plans.js](/src/migrations/20250522093713-create-manufacturing-plans.js) | JavaScript | 67 | 4 | 5 | 76 |
| [src/migrations/20250522093713-create-users.js](/src/migrations/20250522093713-create-users.js) | JavaScript | 63 | 1 | 2 | 66 |
| [src/migrations/20250522093714-create-products.js](/src/migrations/20250522093714-create-products.js) | JavaScript | 55 | 1 | 2 | 58 |
| [src/migrations/20250522093715-create-materials.js](/src/migrations/20250522093715-create-materials.js) | JavaScript | 61 | 1 | 2 | 64 |
| [src/migrations/20250522095132-create-users.js](/src/migrations/20250522095132-create-users.js) | JavaScript | 7 | 13 | 3 | 23 |
| [src/migrations/20250522095150-create-products.js](/src/migrations/20250522095150-create-products.js) | JavaScript | 7 | 13 | 3 | 23 |
| [src/models/BOM.js](/src/models/BOM.js) | JavaScript | 38 | 0 | 2 | 40 |
| [src/models/BOMItem.js](/src/models/BOMItem.js) | JavaScript | 55 | 0 | 2 | 57 |
| [src/models/InventoryItem.js](/src/models/InventoryItem.js) | JavaScript | 54 | 1 | 5 | 60 |
| [src/models/InventoryTransaction.js](/src/models/InventoryTransaction.js) | JavaScript | 42 | 1 | 3 | 46 |
| [src/models/ManufacturingCost.js](/src/models/ManufacturingCost.js) | JavaScript | 61 | 1 | 4 | 66 |
| [src/models/ManufacturingLog.js](/src/models/ManufacturingLog.js) | JavaScript | 62 | 1 | 4 | 67 |
| [src/models/ManufacturingOrder.js](/src/models/ManufacturingOrder.js) | JavaScript | 47 | 0 | 2 | 49 |
| [src/models/ManufacturingOrderDetail.js](/src/models/ManufacturingOrderDetail.js) | JavaScript | 105 | 0 | 2 | 107 |
| [src/models/ManufacturingPlan.js](/src/models/ManufacturingPlan.js) | JavaScript | 58 | 0 | 2 | 60 |
| [src/models/ManufacturingPlanDetail.js](/src/models/ManufacturingPlanDetail.js) | JavaScript | 41 | 0 | 2 | 43 |
| [src/models/Material.js](/src/models/Material.js) | JavaScript | 61 | 0 | 2 | 63 |
| [src/models/MaterialInventory.js](/src/models/MaterialInventory.js) | JavaScript | 48 | 0 | 3 | 51 |
| [src/models/MaterialRequirement.js](/src/models/MaterialRequirement.js) | JavaScript | 27 | 0 | 5 | 32 |
| [src/models/MaterialStatus.js](/src/models/MaterialStatus.js) | JavaScript | 99 | 0 | 3 | 102 |
| [src/models/Product.js](/src/models/Product.js) | JavaScript | 56 | 0 | 3 | 59 |
| [src/models/ProductInventory.js](/src/models/ProductInventory.js) | JavaScript | 47 | 0 | 2 | 49 |
| [src/models/SemiBom.js](/src/models/SemiBom.js) | JavaScript | 44 | 0 | 3 | 47 |
| [src/models/SemiBomItem.js](/src/models/SemiBomItem.js) | JavaScript | 53 | 0 | 3 | 56 |
| [src/models/SemiFinishedProduct.js](/src/models/SemiFinishedProduct.js) | JavaScript | 61 | 0 | 2 | 63 |
| [src/models/SemiProductInventory.js](/src/models/SemiProductInventory.js) | JavaScript | 47 | 1 | 3 | 51 |
| [src/models/User.js](/src/models/User.js) | JavaScript | 77 | 1 | 3 | 81 |
| [src/models/Warehouse.js](/src/models/Warehouse.js) | JavaScript | 59 | 0 | 2 | 61 |
| [src/models/WorkOrder.js](/src/models/WorkOrder.js) | JavaScript | 145 | 10 | 11 | 166 |
| [src/models/index.js](/src/models/index.js) | JavaScript | 150 | 19 | 32 | 201 |
| [src/routes/api.js](/src/routes/api.js) | JavaScript | 6 | 0 | 2 | 8 |
| [src/routes/auth.js](/src/routes/auth.js) | JavaScript | 7 | 0 | 2 | 9 |
| [src/routes/bomRoutes.js](/src/routes/bomRoutes.js) | JavaScript | 9 | 6 | 5 | 20 |
| [src/routes/index.js](/src/routes/index.js) | JavaScript | 33 | 5 | 3 | 41 |
| [src/routes/inventoryRoutes.js](/src/routes/inventoryRoutes.js) | JavaScript | 9 | 3 | 3 | 15 |
| [src/routes/inventoryTransactionRoutes.js](/src/routes/inventoryTransactionRoutes.js) | JavaScript | 10 | 3 | 2 | 15 |
| [src/routes/manufacturingCostRoutes.js](/src/routes/manufacturingCostRoutes.js) | JavaScript | 6 | 4 | 3 | 13 |
| [src/routes/manufacturingLogRoutes.js](/src/routes/manufacturingLogRoutes.js) | JavaScript | 6 | 4 | 3 | 13 |
| [src/routes/manufacturingOrderDetailRoutes.js](/src/routes/manufacturingOrderDetailRoutes.js) | JavaScript | 12 | 2 | 1 | 15 |
| [src/routes/manufacturingOrderRoutes.js](/src/routes/manufacturingOrderRoutes.js) | JavaScript | 9 | 6 | 5 | 20 |
| [src/routes/manufacturingPlanRoutes.js](/src/routes/manufacturingPlanRoutes.js) | JavaScript | 8 | 6 | 5 | 19 |
| [src/routes/materialRequirementRoutes.js](/src/routes/materialRequirementRoutes.js) | JavaScript | 7 | 5 | 4 | 16 |
| [src/routes/materialRoutes.js](/src/routes/materialRoutes.js) | JavaScript | 9 | 7 | 7 | 23 |
| [src/routes/materialStatusRoutes.js](/src/routes/materialStatusRoutes.js) | JavaScript | 23 | 7 | 8 | 38 |
| [src/routes/productRoutes.js](/src/routes/productRoutes.js) | JavaScript | 9 | 7 | 6 | 22 |
| [src/routes/semiFinishedProductRoutes.js](/src/routes/semiFinishedProductRoutes.js) | JavaScript | 9 | 7 | 6 | 22 |
| [src/routes/userRoutes.js](/src/routes/userRoutes.js) | JavaScript | 9 | 8 | 6 | 23 |
| [src/routes/users.js](/src/routes/users.js) | JavaScript | 17 | 3 | 4 | 24 |
| [src/routes/warehouseRoutes.js](/src/routes/warehouseRoutes.js) | JavaScript | 9 | 7 | 6 | 22 |
| [src/routes/workOrderRoutes.js](/src/routes/workOrderRoutes.js) | JavaScript | 15 | 4 | 5 | 24 |
| [src/services/BomService.js](/src/services/BomService.js) | JavaScript | 206 | 15 | 32 | 253 |
| [src/services/InventoryService.js](/src/services/InventoryService.js) | JavaScript | 305 | 9 | 47 | 361 |

[Summary](results.md) / Details / [Diff Summary](diff.md) / [Diff Details](diff-details.md)