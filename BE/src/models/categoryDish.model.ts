import { DataTypes, Model, Optional, Sequelize } from "sequelize";

export interface CategoryDishAttributes {
  id: string;
  name: string;
  created_at?: Date;
  updated_at?: Date;
}

type CategoryDishCreation = Optional<
  CategoryDishAttributes,
  "id" | "created_at" | "updated_at"
>;

export class CategoryDish
  extends Model<CategoryDishAttributes, CategoryDishCreation>
  implements CategoryDishAttributes
{
  public id!: string;
  public name!: string;
  public created_at!: Date;
  public updated_at!: Date;
}

export function initCategoryDishModel(sequelize: Sequelize) {
  CategoryDish.init(
    {
      id: { type: DataTypes.CHAR(36), primaryKey: true },
      name: { type: DataTypes.STRING(100), allowNull: false },
      created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
      updated_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    },
    {
      sequelize,
      tableName: "category_dishes",
      timestamps: false,
    }
  );
}
