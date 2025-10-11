import { DataTypes, Model, type Optional } from "sequelize"
import sequelize from "../config/database"

interface CategoryDishAttributes {
  id: string
  name: string
  description:string
  is_active?: boolean
  created_at?: Date
  updated_at?: Date
}

interface CategoryDishCreationAttributes extends Optional<CategoryDishAttributes, "id"> {}

class CategoryDish
  extends Model<CategoryDishAttributes, CategoryDishCreationAttributes>
  implements CategoryDishAttributes
{
  public id!: string
  public name!: string
  public description!: string
  public is_active?: boolean
  public created_at?: Date
  public updated_at?: Date
}

CategoryDish.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    description: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    tableName: "category_dishes",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  },
)

export default CategoryDish
