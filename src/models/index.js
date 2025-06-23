const sequelize = require('../config/database');

const sequelizeOptions = {
  define: {
    freezeTableName: true,
    underscored: false,
    createdAt: true,
    updatedAt: true,
    deletedAt: false
  }
};

// Áp dụng cấu hình
Object.assign(sequelize.options, sequelizeOptions);

// Import models
const User = require('./User');
const Product = require('./Product');
const Material = require('./Material');
const SemiFinishedProduct = require('./SemiFinishedProduct');
const Warehouse = require('./Warehouse');
const BOM = require('./BOM');
const BOMItem = require('./BOMItem');
const SemiBom = require('./SemiBom');
const SemiBomItem = require('./SemiBomItem');
const ManufacturingPlan = require('./ManufacturingPlan');
const ManufacturingPlanDetail = require('./ManufacturingPlanDetail');
const ManufacturingOrder = require('./ManufacturingOrder');
const ManufacturingOrderDetail = require('./ManufacturingOrderDetail');
const MaterialRequirement = require('./MaterialRequirement');
const InventoryTransaction = require('./InventoryTransaction');
const ProductInventory = require('./ProductInventory');
const MaterialInventory = require('./MaterialInventory');
const SemiProductInventory = require('./SemiProductInventory');
const ManufacturingCost = require('./ManufacturingCost');
const ManufacturingLog = require('./ManufacturingLog');
const WorkOrder = require('./WorkOrder');
const MaterialStatus = require('./MaterialStatus');

// Define relationships after all models are loaded
const defineAssociations = () => {
  try {
    console.log('Defining model associations...');

    // BOM relationships
    BOM.belongsTo(Product, { foreignKey: 'product_id' });
    Product.hasMany(BOM, { foreignKey: 'product_id' });
    BOM.belongsTo(User, { foreignKey: 'created_by' });
    User.hasMany(BOM, { foreignKey: 'created_by' });

    // BOMItem relationships
    BOMItem.belongsTo(BOM, { foreignKey: 'bom_id' });
    BOM.hasMany(BOMItem, { foreignKey: 'bom_id' });
    BOMItem.belongsTo(Material, { foreignKey: 'material_id' });
    Material.hasMany(BOMItem, { foreignKey: 'material_id' });
    BOM.belongsTo(ManufacturingPlan, { foreignKey: 'plan_id' });
    ManufacturingPlan.hasMany(BOM, { foreignKey: 'plan_id' });


    SemiBomItem.belongsTo(SemiBom, {
      foreignKey: 'semi_bom_id',
      as: 'semiBom'
    });

    SemiBomItem.belongsTo(Material, {
      foreignKey: 'material_id',
      as: 'material'
    });

    // ManufacturingPlan relationships
    ManufacturingPlan.belongsTo(User, { foreignKey: 'created_by' });
    User.hasMany(ManufacturingPlan, { foreignKey: 'created_by' });

    // ManufacturingPlanDetail relationships
    ManufacturingPlanDetail.belongsTo(ManufacturingPlan, { foreignKey: 'plan_id' });
    ManufacturingPlan.hasMany(ManufacturingPlanDetail, { foreignKey: 'plan_id' });
    ManufacturingPlanDetail.belongsTo(Product, { foreignKey: 'product_id' });
    Product.hasMany(ManufacturingPlanDetail, { foreignKey: 'product_id' });

    //ManufacturingOrder relationships
    ManufacturingOrder.belongsTo(ManufacturingPlan, { foreignKey: 'plan_id' });
    ManufacturingPlan.hasMany(ManufacturingOrder, { foreignKey: 'plan_id' });
    ManufacturingOrder.belongsTo(Product, { foreignKey: 'product_id' });
    Product.hasMany(ManufacturingOrder, { foreignKey: 'product_id' });
    ManufacturingOrder.belongsTo(User, { foreignKey: 'created_by' });
    User.hasMany(ManufacturingOrder, { foreignKey: 'created_by' });


    ManufacturingOrder.hasMany(ManufacturingOrderDetail, { foreignKey: 'order_id' });
    ManufacturingOrderDetail.belongsTo(ManufacturingOrder, { foreignKey: 'order_id' });

    ManufacturingOrderDetail.hasMany(WorkOrder, { foreignKey: 'detail_id' });
    WorkOrder.belongsTo(ManufacturingOrderDetail, { foreignKey: 'detail_id' });
    // WorkOrder relationships
    WorkOrder.belongsTo(ManufacturingOrder, { foreignKey: 'order_id' });
    ManufacturingOrder.hasMany(WorkOrder, { foreignKey: 'order_id' });
    WorkOrder.belongsTo(SemiFinishedProduct, { foreignKey: 'semi_product_id' });
    SemiFinishedProduct.hasMany(WorkOrder, { foreignKey: 'semi_product_id' });
    WorkOrder.belongsTo(User, { foreignKey: 'assigned_to', as: 'AssignedUser' });
    User.hasMany(WorkOrder, { foreignKey: 'assigned_to' });

    // MaterialRequirement relationships
    MaterialRequirement.belongsTo(WorkOrder, { foreignKey: 'work_id' });
    WorkOrder.hasMany(MaterialRequirement, { foreignKey: 'work_id' });
    MaterialRequirement.belongsTo(Material, { foreignKey: 'material_id' });
    Material.hasMany(MaterialRequirement, { foreignKey: 'material_id' });

    // Product Inventory relationships  
    Product.hasMany(ProductInventory, { foreignKey: 'product_id', as: 'ProductInventories' });
    ProductInventory.belongsTo(Product, { foreignKey: 'product_id' });

    ProductInventory.belongsTo(Warehouse, { foreignKey: 'warehouse_id' });
    Warehouse.hasMany(ProductInventory, { foreignKey: 'warehouse_id', as: 'ProductInventories' });

    // Material Inventory relationships
    Material.hasMany(MaterialInventory, { foreignKey: 'material_id' });
    MaterialInventory.belongsTo(Material, { foreignKey: 'material_id' });

    Warehouse.hasMany(MaterialInventory, { foreignKey: 'warehouse_id' });
    MaterialInventory.belongsTo(Warehouse, { foreignKey: 'warehouse_id' });


    // Semi Product Inventory relationships
    SemiFinishedProduct.hasMany(SemiProductInventory, { foreignKey: 'semi_product_id' });
    SemiProductInventory.belongsTo(SemiFinishedProduct, { foreignKey: 'semi_product_id' });
    SemiProductInventory.belongsTo(Warehouse, { foreignKey: 'warehouse_id' });
    Warehouse.hasMany(SemiProductInventory, { foreignKey: 'warehouse_id' });
    // InventoryTransaction relationships
    InventoryTransaction.belongsTo(Warehouse, { foreignKey: 'from_warehouse_id', as: 'FromWarehouse' });
    Warehouse.hasMany(InventoryTransaction, { foreignKey: 'from_warehouse_id', as: 'OutgoingTransactions' });

    InventoryTransaction.belongsTo(Warehouse, { foreignKey: 'to_warehouse_id', as: 'ToWarehouse' });
    Warehouse.hasMany(InventoryTransaction, { foreignKey: 'to_warehouse_id', as: 'IncomingTransactions' });

    InventoryTransaction.belongsTo(User, { foreignKey: 'created_by', as: 'CreatedByUser' });
    User.hasMany(InventoryTransaction, { foreignKey: 'created_by', as: 'CreatedTransactions' });

    //ManufacturingCost relationships
    ManufacturingCost.belongsTo(ManufacturingOrder, { foreignKey: 'order_id' });
    ManufacturingOrder.hasMany(ManufacturingCost, { foreignKey: 'order_id' });
    ManufacturingCost.belongsTo(User, { foreignKey: 'created_by', as: 'CreatedByUser' });
    User.hasMany(ManufacturingCost, { foreignKey: 'created_by' });

    //ManufacturingLog relationships
    ManufacturingLog.belongsTo(WorkOrder, { foreignKey: 'work_id' });
    WorkOrder.hasMany(ManufacturingLog, { foreignKey: 'work_id' });
    ManufacturingLog.belongsTo(User, { foreignKey: 'created_by', as: 'CreatedByUser' });
    User.hasMany(ManufacturingLog, { foreignKey: 'created_by' });


    // MaterialStatus relationships
    MaterialStatus.belongsTo(WorkOrder, { foreignKey: 'work_id' });
    WorkOrder.hasMany(MaterialStatus, { foreignKey: 'work_id' });
    MaterialStatus.belongsTo(Material, { foreignKey: 'material_id' });
    Material.hasMany(MaterialStatus, { foreignKey: 'material_id' });

    console.log('Model associations defined successfully');
  } catch (error) {
    console.error('Error defining associations:', error);
  }
};

// Call defineAssociations after all models are loaded
defineAssociations();

// Hàm đồng bộ database
const syncDatabase = async () => {
  try {
    const syncOptions = {
      force: true,
    };
    await sequelize.sync(syncOptions);
    console.log('Database synchronized successfully');
  } catch (error) {
    console.error('Error synchronizing database:', error);
    throw error; // Re-throw để xem lỗi chi tiết
  }
};

module.exports = {
  sequelize,
  User,
  Product,
  Material,
  SemiFinishedProduct,
  Warehouse,
  BOM,
  BOMItem,
  ManufacturingPlan,
  ManufacturingPlanDetail,
  ManufacturingOrder,
  ManufacturingOrderDetail,
  WorkOrder,
  MaterialRequirement,
  InventoryTransaction,
  ManufacturingCost,
  ManufacturingLog,
  ProductInventory,
  MaterialInventory,
  SemiProductInventory,
  MaterialStatus,
  syncDatabase,
}; 