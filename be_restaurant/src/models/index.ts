import User from "./User"
import Employee from "./Employee"
import EmployeeShift from "./EmployeeShift"
import AttendanceLog from "./AttendanceLog"
import Payroll from "./Payroll"
import CategoryDish from "./CategoryDish"
import Dish from "./Dish"
import Ingredient from "./Ingredient"
import DishIngredient from "./DishIngredient"
import Supplier from "./Supplier"
import InventoryImport from "./InventoryImport"
import InventoryImportIngredient from "./InventoryImportIngredient"
import Table from "./Table"
import TableGroup from "./TableGroup"
import Voucher from "./Voucher"
import Reservation from "./Reservation"
import Order from "./Order"
import OrderItem from "./OrderItem"
import VoucherUsage from "./VoucherUsage"
import Review from "./Review"
import Complaint from "./Complaint"
import Event from "./Event"
import EventBooking from "./EventBooking"
import Notification from "./Notification"
import BlogPost from "./BlogPost"
import ChatSession from "./ChatSession"
import ChatMessage from "./ChatMessage"
import UserBehaviorLog from "./UserBehaviorLog"

// Define associations
User.hasOne(Employee, { foreignKey: "user_id", as: "employee" })
Employee.belongsTo(User, { foreignKey: "user_id", as: "user" })

Employee.hasMany(EmployeeShift, { foreignKey: "employee_id", as: "shifts" })
EmployeeShift.belongsTo(Employee, { foreignKey: "employee_id", as: "employee" })

Employee.hasMany(AttendanceLog, { foreignKey: "employee_id", as: "attendanceLogs" })
AttendanceLog.belongsTo(Employee, { foreignKey: "employee_id", as: "employee" })

Employee.hasMany(Payroll, { foreignKey: "employee_id", as: "payrolls" })
Payroll.belongsTo(Employee, { foreignKey: "employee_id", as: "employee" })

CategoryDish.hasMany(Dish, { foreignKey: "category_id", as: "dishes" })
Dish.belongsTo(CategoryDish, { foreignKey: "category_id", as: "category" })

Dish.belongsToMany(Ingredient, { through: DishIngredient, foreignKey: "dish_id", as: "ingredients" })
Ingredient.belongsToMany(Dish, { through: DishIngredient, foreignKey: "ingredient_id", as: "dishes" })

Employee.hasMany(InventoryImport, { foreignKey: "employee_id", as: "inventoryImports" })
InventoryImport.belongsTo(Employee, { foreignKey: "employee_id", as: "employee" })

Supplier.hasMany(InventoryImport, { foreignKey: "supplier_id", as: "inventoryImports" })
InventoryImport.belongsTo(Supplier, { foreignKey: "supplier_id", as: "supplier" })

InventoryImport.hasMany(InventoryImportIngredient, { foreignKey: "inventory_imports_id", as: "ingredients" })
InventoryImportIngredient.belongsTo(InventoryImport, { foreignKey: "inventory_imports_id", as: "inventoryImport" })

Ingredient.hasMany(InventoryImportIngredient, { foreignKey: "ingredient_id", as: "imports" })
InventoryImportIngredient.belongsTo(Ingredient, { foreignKey: "ingredient_id", as: "ingredient" })

User.hasMany(Reservation, { foreignKey: "user_id", as: "reservations" })
Reservation.belongsTo(User, { foreignKey: "user_id", as: "user" })

Table.hasMany(Reservation, { foreignKey: "table_id", as: "reservations" })
Reservation.belongsTo(Table, { foreignKey: "table_id", as: "table" })

TableGroup.hasMany(Reservation, { foreignKey: "table_group_id", as: "reservations" })
Reservation.belongsTo(TableGroup, { foreignKey: "table_group_id", as: "tableGroup" })

User.hasMany(Order, { foreignKey: "user_id", as: "orders" })
Order.belongsTo(User, { foreignKey: "user_id", as: "user" })

Reservation.hasMany(Order, { foreignKey: "reservation_id", as: "orders" })
Order.belongsTo(Reservation, { foreignKey: "reservation_id", as: "reservation" })

Table.hasMany(Order, { foreignKey: "table_id", as: "orders" })
Order.belongsTo(Table, { foreignKey: "table_id", as: "table" })

TableGroup.hasMany(Order, { foreignKey: "table_group_id", as: "orders" })
Order.belongsTo(TableGroup, { foreignKey: "table_group_id", as: "tableGroup" })

Voucher.hasMany(Order, { foreignKey: "voucher_id", as: "orders" })
Order.belongsTo(Voucher, { foreignKey: "voucher_id", as: "voucher" })

Order.hasMany(OrderItem, { foreignKey: "order_id", as: "items" })
OrderItem.belongsTo(Order, { foreignKey: "order_id", as: "order" })

Dish.hasMany(OrderItem, { foreignKey: "dish_id", as: "orderItems" })
OrderItem.belongsTo(Dish, { foreignKey: "dish_id", as: "dish" })

Voucher.hasMany(VoucherUsage, { foreignKey: "voucher_id", as: "usages" })
VoucherUsage.belongsTo(Voucher, { foreignKey: "voucher_id", as: "voucher" })

Order.hasMany(VoucherUsage, { foreignKey: "order_id", as: "voucherUsages" })
VoucherUsage.belongsTo(Order, { foreignKey: "order_id", as: "order" })

User.hasMany(VoucherUsage, { foreignKey: "user_id", as: "voucherUsages" })
VoucherUsage.belongsTo(User, { foreignKey: "user_id", as: "user" })

User.hasMany(Review, { foreignKey: "user_id", as: "reviews" })
Review.belongsTo(User, { foreignKey: "user_id", as: "user" })

Order.hasMany(Review, { foreignKey: "order_id", as: "reviews" })
Review.belongsTo(Order, { foreignKey: "order_id", as: "order" })

Dish.hasMany(Review, { foreignKey: "dish_id", as: "reviews" })
Review.belongsTo(Dish, { foreignKey: "dish_id", as: "dish" })

OrderItem.hasMany(Review, { foreignKey: "order_item_id", as: "itemReviews" })
Review.belongsTo(OrderItem, { foreignKey: "order_item_id", as: "orderItem" })

Table.hasMany(Review, { foreignKey: "table_id", as: "reviews" })
Review.belongsTo(Table, { foreignKey: "table_id", as: "table" })

User.hasMany(Complaint, { foreignKey: "user_id", as: "complaints" })
Complaint.belongsTo(User, { foreignKey: "user_id", as: "user" })

Order.hasMany(Complaint, { foreignKey: "order_id", as: "complaints" })
Complaint.belongsTo(Order, { foreignKey: "order_id", as: "order" })

OrderItem.hasMany(Complaint, { foreignKey: "order_item_id", as: "complaints" })
Complaint.belongsTo(OrderItem, { foreignKey: "order_item_id", as: "orderItem" })

Event.hasMany(EventBooking, { foreignKey: "event_id", as: "bookings" })
EventBooking.belongsTo(Event, { foreignKey: "event_id", as: "event" })

Reservation.hasMany(EventBooking, { foreignKey: "reservation_id", as: "eventBookings" })
EventBooking.belongsTo(Reservation, { foreignKey: "reservation_id", as: "reservation" })

User.hasMany(Notification, { foreignKey: "user_id", as: "notifications" })
Notification.belongsTo(User, { foreignKey: "user_id", as: "user" })

User.hasMany(BlogPost, { foreignKey: "author_id", as: "blogPosts" })
BlogPost.belongsTo(User, { foreignKey: "author_id", as: "author" })

User.hasMany(ChatSession, { foreignKey: "user_id", as: "chatSessions" })
ChatSession.belongsTo(User, { foreignKey: "user_id", as: "user" })

ChatSession.hasMany(ChatMessage, { foreignKey: "session_id", as: "messages" })
ChatMessage.belongsTo(ChatSession, { foreignKey: "session_id", as: "session" })

User.hasMany(UserBehaviorLog, { foreignKey: "user_id", as: "behaviorLogs" })
UserBehaviorLog.belongsTo(User, { foreignKey: "user_id", as: "user" })

export {
  User,
  Employee,
  EmployeeShift,
  AttendanceLog,
  Payroll,
  CategoryDish,
  Dish,
  Ingredient,
  DishIngredient,
  Supplier,
  InventoryImport,
  InventoryImportIngredient,
  Table,
  TableGroup,
  Voucher,
  Reservation,
  Order,
  OrderItem,
  VoucherUsage,
  Review,
  Complaint,
  Event,
  EventBooking,
  Notification,
  BlogPost,
  ChatSession,
  ChatMessage,
  UserBehaviorLog,
}
