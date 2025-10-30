import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../config/database";

export interface RestaurantAreaAttributes {
  id: string;
  name: string;                 
  area_size: number;       
  shape_type: "square" | "rectangle" | "circle" | "polygon";             
  status: "active" | "maintenance" | "clean";
  created_at?: Date;
  updated_at?: Date;
  deleted_at?: Date;
}

export interface RestaurantAreaCreationAttributes
  extends Optional<RestaurantAreaAttributes, "id"> {}

class RestaurantArea
  extends Model<RestaurantAreaAttributes, RestaurantAreaCreationAttributes>
  implements RestaurantAreaAttributes
{
  public id!: string;
  public name!: string;
  public area_size!: number;
  public shape_type!: "square" | "rectangle" | "circle" | "polygon";
  public shape_points?: any;
  public floor_number?: number;
  public status!: "active" | "maintenance" | "clean";
  public readonly created_at?: Date;
  public readonly updated_at?: Date;
  public readonly deleted_at?: Date;
}

RestaurantArea.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(200),
      allowNull: false,
    },
    area_size: {
      type: DataTypes.FLOAT,
      allowNull: false,
      comment: "Diện tích khu vực (m²)",
    },
    shape_type: {
      type: DataTypes.ENUM("square", "rectangle", "circle", "polygon"),
      allowNull: false,
      comment: "Hình dạng khu vực",
    },
    status: {
      type: DataTypes.ENUM("active", "maintenance", "clean"),
      defaultValue: "active",
      allowNull: false,
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    deleted_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: "restaurant_areas",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
    deletedAt: "deleted_at"
  }
);

export default RestaurantArea;
