import { DataTypes, Model, Optional, Sequelize } from "sequelize";

export interface ComplaintAttributes {
  id: string;
  user_id?: string | null;
  description: string;
  status?: "open" | "assigned" | "resolved";
  resolution_notes?: string | null;
  created_at?: Date;
  updated_at?: Date;
}

type ComplaintCreation = Optional<
  ComplaintAttributes,
  "id" | "status" | "resolution_notes" | "created_at" | "updated_at"
>;

export class Complaint
  extends Model<ComplaintAttributes, ComplaintCreation>
  implements ComplaintAttributes
{
  public id!: string;
  public user_id!: string | null;
  public description!: string;
  public status!: "open" | "assigned" | "resolved";
  public resolution_notes!: string | null;
  public created_at!: Date;
  public updated_at!: Date;
}

export function initComplaintModel(sequelize: Sequelize) {
  Complaint.init(
    {
      id: { type: DataTypes.CHAR(36), primaryKey: true },
      user_id: { type: DataTypes.CHAR(36), allowNull: true },
      description: { type: DataTypes.TEXT, allowNull: false },
      status: {
        type: DataTypes.ENUM("open", "assigned", "resolved"),
        defaultValue: "open",
      },
      resolution_notes: { type: DataTypes.TEXT, allowNull: true },
      created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
      updated_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    },
    {
      sequelize,
      tableName: "complaints",
      timestamps: false,
    }
  );
}
