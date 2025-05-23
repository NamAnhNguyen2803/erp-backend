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
const Inventory = require('./Inventory');
const BOM = require('./BOM');
const BOMItem = require('./BOMItem');
const ManufacturePlan = require('./ManufacturePlan');
const ManufacturingPlanDetail = require('./ManufacturingPlanDetail');
const ManufactureOrder = require('./ManufactureOrder');
const WorkStation = require('./WorkStation');
const ManufactureStep = require('./ManufactureStep');
const WorkOrder = require('./WorkOrder');
const MaterialRequirement = require('./MaterialRequirement');
const InventoryTransaction = require('./InventoryTransaction');
const ProductInventory = require('./ProductInventory');
const MaterialInventory = require('./MaterialInventory');
const SemiProductInventory = require('./SemiProductInventory');
const ManufactureCost = require('./ManufactureCost');
const ManufactureLog = require('./ManufactureLog');

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
    BOMItem.belongsTo(Material, { foreignKey: 'material_id', as: 'Material' });
    Material.hasMany(BOMItem, { foreignKey: 'material_id' });

    // ManufacturePlan relationships
    ManufacturePlan.belongsTo(User, { foreignKey: 'created_by' });
    User.hasMany(ManufacturePlan, { foreignKey: 'created_by' });

    // ManufacturingPlanDetail relationships
    ManufacturingPlanDetail.belongsTo(ManufacturePlan, { foreignKey: 'plan_id' });
    ManufacturePlan.hasMany(ManufacturingPlanDetail, { foreignKey: 'plan_id' });
    ManufacturingPlanDetail.belongsTo(Product, { foreignKey: 'product_id' });
    Product.hasMany(ManufacturingPlanDetail, { foreignKey: 'product_id' });

    // ManufactureOrder relationships
    ManufactureOrder.belongsTo(ManufacturePlan, { foreignKey: 'plan_id' });
    ManufacturePlan.hasMany(ManufactureOrder, { foreignKey: 'plan_id' });
    ManufactureOrder.belongsTo(Product, { foreignKey: 'product_id' });
    Product.hasMany(ManufactureOrder, { foreignKey: 'product_id' });
    ManufactureOrder.belongsTo(BOM, { foreignKey: 'bom_id' });
    BOM.hasMany(ManufactureOrder, { foreignKey: 'bom_id' });
    ManufactureOrder.belongsTo(User, { foreignKey: 'created_by' });
    User.hasMany(ManufactureOrder, { foreignKey: 'created_by' });

    // WorkOrder relationships
    WorkOrder.belongsTo(ManufactureOrder, { foreignKey: 'order_id' });
    ManufactureOrder.hasMany(WorkOrder, { foreignKey: 'order_id' });
    WorkOrder.belongsTo(ManufactureStep, { foreignKey: 'step_id' });
    ManufactureStep.hasMany(WorkOrder, { foreignKey: 'step_id' });
    WorkOrder.belongsTo(WorkStation, { foreignKey: 'station_id' });
    WorkStation.hasMany(WorkOrder, { foreignKey: 'station_id' });
    WorkOrder.belongsTo(SemiFinishedProduct, { foreignKey: 'semi_product_id' });
    SemiFinishedProduct.hasMany(WorkOrder, { foreignKey: 'semi_product_id' });
    WorkOrder.belongsTo(User, { foreignKey: 'assigned_to', as: 'AssignedUser' });
    User.hasMany(WorkOrder, { foreignKey: 'assigned_to' });

    // MaterialRequirement relationships
    MaterialRequirement.belongsTo(WorkOrder, { foreignKey: 'work_id' });
    WorkOrder.hasMany(MaterialRequirement, { foreignKey: 'work_id' });
    MaterialRequirement.belongsTo(Material, { foreignKey: 'material_id' });
    Material.hasMany(MaterialRequirement, { foreignKey: 'material_id' });

    // Inventory relationships
    Inventory.belongsTo(Warehouse, { foreignKey: 'warehouse_id' });
    Warehouse.hasMany(Inventory, { foreignKey: 'warehouse_id' });


    // Product Inventory relationships  
    Product.hasMany(ProductInventory, { foreignKey: 'product_id', as: 'ProductInventories' });
    ProductInventory.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });
    
    ProductInventory.belongsTo(Warehouse, { foreignKey: 'warehouse_id', as: 'Warehouse' });
    Warehouse.hasMany(ProductInventory, { foreignKey: 'warehouse_id', as: 'ProductInventories' }); 

    // Material Inventory relationships
    Material.hasMany(MaterialInventory, { foreignKey: 'material_id' });
    MaterialInventory.belongsTo(Material, { foreignKey: 'material_id' });
    MaterialInventory.belongsTo(Warehouse, { foreignKey: 'warehouse_id' });
    Warehouse.hasMany(MaterialInventory, { foreignKey: 'warehouse_id' });

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

    // ManufactureCost relationships
    ManufactureCost.belongsTo(ManufactureOrder, { foreignKey: 'order_id' });
    ManufactureOrder.hasMany(ManufactureCost, { foreignKey: 'order_id' });
    ManufactureCost.belongsTo(User, { foreignKey: 'created_by', as: 'CreatedByUser' });
    User.hasMany(ManufactureCost, { foreignKey: 'created_by' });

    // ManufactureLog relationships
    ManufactureLog.belongsTo(WorkOrder, { foreignKey: 'work_id' });
    WorkOrder.hasMany(ManufactureLog, { foreignKey: 'work_id' });
    ManufactureLog.belongsTo(User, { foreignKey: 'created_by', as: 'CreatedByUser' });
    User.hasMany(ManufactureLog, { foreignKey: 'created_by' });

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
    // Thiết lập các tùy chọn đồng bộ cơ sở dữ liệu
    // const syncOptions = {
    //   alter: true,
    // };

    // console.log('Starting database synchronization with options:', syncOptions);

    await sequelize.sync();
    console.log('Database synchronized successfully');
  } catch (error) {
    console.error('Error synchronizing database:', error);
    throw error; // Re-throw để xem lỗi chi tiết
  }
};

module.exports = {
  sequelize,
  syncDatabase,
  User,
  Product,
  Material,
  SemiFinishedProduct,
  Warehouse,
  Inventory,
  BOM,
  BOMItem,
  ManufacturePlan,
  ManufacturingPlanDetail,
  ManufactureOrder,
  WorkStation,
  ManufactureStep,
  WorkOrder,
  MaterialRequirement,
  InventoryTransaction,
  ManufactureCost,
  ManufactureLog,
  ProductInventory,
  MaterialInventory,
  SemiProductInventory
}; 