import { DataTypes, Model, Optional, Sequelize } from "sequelize";

export interface TableGroupAttributes {
  id: string;
  group_name: string;
  table_ids: object;
  total_capacity: number;
  book_minutes?: number;
  deposit?: number;
  cancel_minutes?: number;
  status?: "available" | "occupied" | "cleaning" | "reserved";
  created_at?: Date;
  updated_at?: Date;
  deleted_at?: Date | null;
}

type TableGroupCreation = Optional<
  TableGroupAttributes,
  | "id"
  | "book_minutes"
  | "deposit"
  | "cancel_minutes"
  | "status"
  | "created_at"
  | "updated_at"
  | "deleted_at"
>;

export class TableGroup
  extends Model<TableGroupAttributes, TableGroupCreation>
  implements TableGroupAttributes
{
  public id!: string;
  public group_name!: string;
  public table_ids!: object;
  public total_capacity!: number;
  public book_minutes!: number;
  public deposit!: number;
  public cancel_minutes!: number;
  public status!: "available" | "occupied" | "cleaning" | "reserved";
  public created_at!: Date;
  public updated_at!: Date;
  public deleted_at!: Date | null;
}

export function initTableGroupModel(sequelize: Sequelize) {
  TableGroup.init(
    {
      id: { type: DataTypes.CHAR(36), primaryKey: true },
      group_name: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true,
      },
      table_ids: { type: DataTypes.JSON, allowNull: false },
      total_capacity: { type: DataTypes.INTEGER, allowNull: false },
      book_minutes: { type: DataTypes.INTEGER, defaultValue: 0 },
      deposit: { type: DataTypes.INTEGER, defaultValue: 0 },
      cancel_minutes: { type: DataTypes.INTEGER, defaultValue: 0 },
      status: {
        type: DataTypes.ENUM("available", "occupied", "cleaning", "reserved"),
        defaultValue: "available",
      },
      created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
      updated_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
      deleted_at: { type: DataTypes.DATE, allowNull: true },
    },
    {
      sequelize,
      tableName: "table_groups",
      timestamps: false,
    }
  );
}
