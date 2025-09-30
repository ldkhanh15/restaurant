import { DataTypes, Model, Optional, Sequelize } from "sequelize";

export interface EventAttributes {
  id: string;
  name: string;
  description?: string | null;
  price?: number | null;
  inclusions?: object | null;
  decorations?: object | null;
  status?: "planned" | "ongoing" | "completed";
  created_at?: Date;
  deleted_at?: Date | null;
}

type EventCreation = Optional<
  EventAttributes,
  | "id"
  | "description"
  | "price"
  | "inclusions"
  | "decorations"
  | "status"
  | "created_at"
  | "deleted_at"
>;

export class Event
  extends Model<EventAttributes, EventCreation>
  implements EventAttributes
{
  public id!: string;
  public name!: string;
  public description!: string | null;
  public price!: number | null;
  public inclusions!: object | null;
  public decorations!: object | null;
  public status!: "planned" | "ongoing" | "completed";
  public created_at!: Date;
  public deleted_at!: Date | null;
}

export function initEventModel(sequelize: Sequelize) {
  Event.init(
    {
      id: { type: DataTypes.CHAR(36), primaryKey: true },
      name: { type: DataTypes.STRING(100), allowNull: false },
      description: { type: DataTypes.TEXT, allowNull: true },
      price: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
      inclusions: { type: DataTypes.JSON, allowNull: true },
      decorations: { type: DataTypes.JSON, allowNull: true },
      status: {
        type: DataTypes.ENUM("planned", "ongoing", "completed"),
        defaultValue: "planned",
      },
      created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
      deleted_at: { type: DataTypes.DATE, allowNull: true },
    },
    {
      sequelize,
      tableName: "events",
      timestamps: false,
    }
  );
}
