import { sequelize } from "../config/database";
import { initUserModel, User } from "./user.model";
import { initDishModel, Dish } from "./dish.model";
import { initIngredientModel, Ingredient } from "./ingredient.model";
import { initTableModel, Table } from "./table.model";
import { initReservationModel, Reservation } from "./reservation.model";
import { initOrderModel, Order } from "./order.model";
import { initOrderItemModel, OrderItem } from "./orderItem.model";
import { initVoucherModel, Voucher } from "./voucher.model";
import { initAttendanceLogModel, AttendanceLog } from "./attendance.model";
import { initBlogPostModel, BlogPost } from "./blogPost.model";
import { initCategoryDishModel, CategoryDish } from "./categoryDish.model";
import { initChatMessageModel, ChatMessage } from "./chatMessage.model";
import { initChatSessionModel, ChatSession } from "./chatSession.model";
import { initComplaintModel, Complaint } from "./complaint.model";
import {
  initDishIngredientModel,
  DishIngredient,
} from "./dishIngredient.model";
import { initEmployeeModel, Employee } from "./employee.model";
import {
  initEmployeeShiftModel,
  EmployeeShift,
} from "./employeeShift.model";
import { initEventModel, Event } from "./event.model";
import { initEventBookingModel, EventBooking } from "./eventBooking.model";
import {
  initInventoryImportModel,
  InventoryImport,
} from "./inventoryImport.model";
import {
  initInventoryImportIngredientModel,
  InventoryImportIngredient,
} from "./inventoryImportIngredient.model";
import { initNotificationModel, Notification } from "./notification.model";
import { initOrderItemLogModel, OrderItemLog } from "./orderItemLog.model";
import { initPayrollModel, Payroll } from "./payroll.model";
import { initReviewModel, Review } from "./review.model";
import { initSupplierModel, Supplier } from "./supplier.model";
import { initTableGroupModel, TableGroup } from "./tableGroup.model";
import {
  initUserBehaviorLogModel,
  UserBehaviorLog,
} from "./userBehaviorLog.model";
import { initVoucherUsageModel, VoucherUsage } from "./voucherUsage.model";

// Initialize all models
initUserModel(sequelize);
initDishModel(sequelize);
initIngredientModel(sequelize);
initTableModel(sequelize);
initReservationModel(sequelize);
initOrderModel(sequelize);
initOrderItemModel(sequelize);
initVoucherModel(sequelize);
initAttendanceLogModel(sequelize);
initBlogPostModel(sequelize);
initCategoryDishModel(sequelize);
initChatMessageModel(sequelize);
initChatSessionModel(sequelize);
initComplaintModel(sequelize);
initDishIngredientModel(sequelize);
initEmployeeModel(sequelize);
initEmployeeShiftModel(sequelize);
initEventModel(sequelize);
initEventBookingModel(sequelize);
initInventoryImportModel(sequelize);
initInventoryImportIngredientModel(sequelize);
initNotificationModel(sequelize);
initOrderItemLogModel(sequelize);
initPayrollModel(sequelize);
initReviewModel(sequelize);
initSupplierModel(sequelize);
initTableGroupModel(sequelize);
initUserBehaviorLogModel(sequelize);
initVoucherUsageModel(sequelize);

// Existing associations
User.hasMany(Reservation, { foreignKey: "user_id" });
Reservation.belongsTo(User, { foreignKey: "user_id" });

Table.hasMany(Reservation, { foreignKey: "table_id" });
Reservation.belongsTo(Table, { foreignKey: "table_id" });

User.hasMany(Order, { foreignKey: "user_id" });
Order.belongsTo(User, { foreignKey: "user_id" });

Reservation.hasMany(Order, { foreignKey: "reservation_id" });
Order.belongsTo(Reservation, { foreignKey: "reservation_id" });

Table.hasMany(Order, { foreignKey: "table_id" });
Order.belongsTo(Table, { foreignKey: "table_id" });

Order.hasMany(OrderItem, { foreignKey: "order_id" });
OrderItem.belongsTo(Order, { foreignKey: "order_id" });

Dish.hasMany(OrderItem, { foreignKey: "dish_id" });
OrderItem.belongsTo(Dish, { foreignKey: "dish_id" });

// New associations
CategoryDish.hasMany(Dish, { foreignKey: "category_id" });
Dish.belongsTo(CategoryDish, { foreignKey: "category_id" });

Dish.belongsToMany(Ingredient, {
  through: DishIngredient,
  foreignKey: "dish_id",
});
Ingredient.belongsToMany(Dish, {
  through: DishIngredient,
  foreignKey: "ingredient_id",
});

Employee.belongsTo(User, { foreignKey: "user_id" });
User.hasOne(Employee, { foreignKey: "user_id" });

Employee.hasMany(EmployeeShift, { foreignKey: "employee_id" });
EmployeeShift.belongsTo(Employee, { foreignKey: "employee_id" });

Employee.hasMany(AttendanceLog, { foreignKey: "employee_id" });
AttendanceLog.belongsTo(Employee, { foreignKey: "employee_id" });

Employee.hasMany(Payroll, { foreignKey: "employee_id" });
Payroll.belongsTo(Employee, { foreignKey: "employee_id" });

User.hasMany(Complaint, { foreignKey: "user_id" });
Complaint.belongsTo(User, { foreignKey: "user_id" });

User.hasMany(Review, { foreignKey: "user_id" });
Review.belongsTo(User, { foreignKey: "user_id" });

Order.hasMany(Review, { foreignKey: "order_id" });
Review.belongsTo(Order, { foreignKey: "order_id" });

Dish.hasMany(Review, { foreignKey: "dish_id" });
Review.belongsTo(Dish, { foreignKey: "dish_id" });

User.hasMany(BlogPost, { foreignKey: "author_id" });
BlogPost.belongsTo(User, { foreignKey: "author_id" });

User.hasMany(ChatSession, { foreignKey: "user_id" });
ChatSession.belongsTo(User, { foreignKey: "user_id" });

ChatSession.hasMany(ChatMessage, { foreignKey: "session_id" });
ChatMessage.belongsTo(ChatSession, { foreignKey: "session_id" });

Event.hasMany(EventBooking, { foreignKey: "event_id" });
EventBooking.belongsTo(Event, { foreignKey: "event_id" });

Reservation.hasMany(EventBooking, { foreignKey: "reservation_id" });
EventBooking.belongsTo(Reservation, { foreignKey: "reservation_id" });

Employee.hasMany(InventoryImport, { foreignKey: "employee_id" });
InventoryImport.belongsTo(Employee, { foreignKey: "employee_id" });

Supplier.hasMany(InventoryImport, { foreignKey: "supplier_id" });
InventoryImport.belongsTo(Supplier, { foreignKey: "supplier_id" });

InventoryImport.hasMany(InventoryImportIngredient, {
  foreignKey: "inventory_imports_id",
});
InventoryImportIngredient.belongsTo(InventoryImport, {
  foreignKey: "inventory_imports_id",
});

Ingredient.hasMany(InventoryImportIngredient, { foreignKey: "ingredient_id" });
InventoryImportIngredient.belongsTo(Ingredient, {
  foreignKey: "ingredient_id",
});

User.hasMany(Notification, { foreignKey: "user_id" });
Notification.belongsTo(User, { foreignKey: "user_id" });

OrderItem.hasMany(OrderItemLog, { foreignKey: "order_item_id" });
OrderItemLog.belongsTo(OrderItem, { foreignKey: "order_item_id" });

User.hasMany(UserBehaviorLog, { foreignKey: "user_id" });
UserBehaviorLog.belongsTo(User, { foreignKey: "user_id" });

TableGroup.belongsToMany(Table, {
  through: "table_group_tables",
  foreignKey: "table_group_id",
});
Table.belongsToMany(TableGroup, {
  through: "table_group_tables",
  foreignKey: "table_id",
});

export {
  sequelize,
  User,
  Dish,
  Ingredient,
  Table,
  Reservation,
  Order,
  OrderItem,
  Voucher,
  AttendanceLog,
  BlogPost,
  CategoryDish,
  ChatMessage,
  ChatSession,
  Complaint,
  DishIngredient,
  Employee,
  EmployeeShift,
  Event,
  EventBooking,
  InventoryImport,
  InventoryImportIngredient,
  Notification,
  OrderItemLog,
  Payroll,
  Review,
  Supplier,
  TableGroup,
  UserBehaviorLog,
  VoucherUsage,
};
