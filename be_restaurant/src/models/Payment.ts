import { DataTypes, Model, type Optional } from "sequelize"
import sequelize from "../config/database"

interface PaymentAttributes {
    id: string
    order_id?: string
    reservation_id?: string
    amount: number
    method: "cash" | "vnpay"
    status: "pending" | "completed" | "failed"
    transaction_id?: string
    created_at?: Date
    updated_at?: Date
}

interface PaymentCreationAttributes extends Optional<PaymentAttributes, "id" | "transaction_id" | "order_id" | "reservation_id"> { }

class Payment extends Model<PaymentAttributes, PaymentCreationAttributes> implements PaymentAttributes {
    public id!: string
    public order_id?: string
    public reservation_id?: string
    public amount!: number
    public method!: "cash" | "vnpay"
    public status!: "pending" | "completed" | "failed"
    public transaction_id?: string
    public created_at?: Date
    public updated_at?: Date
}

Payment.init(
    {
        id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
        order_id: {
            type: DataTypes.UUID,
            allowNull: true,
            references: { model: "orders", key: "id" },
            onDelete: "SET NULL",
        },
        reservation_id: {
            type: DataTypes.UUID,
            allowNull: true,
            references: { model: "reservations", key: "id" },
            onDelete: "SET NULL",
        },
        amount: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
        method: { type: DataTypes.ENUM("cash", "credit_card", "momo", "vnpay", "zalopay", "card", "qr"), allowNull: false },
        status: { type: DataTypes.ENUM("pending", "completed", "failed"), allowNull: false, defaultValue: "pending" },
        transaction_id: { type: DataTypes.STRING(100), allowNull: true },
        created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
        updated_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    },
    {
        sequelize,
        tableName: "payments",
        timestamps: true,
        createdAt: "created_at",
        updatedAt: "updated_at",
    },
)

export default Payment


