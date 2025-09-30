import { DataTypes, Model } from "sequelize"
import sequelize from "../config/database"

interface DishIngredientAttributes {
  dish_id: string
  ingredient_id: string
  quantity: number
}

class DishIngredient extends Model<DishIngredientAttributes> implements DishIngredientAttributes {
  public dish_id!: string
  public ingredient_id!: string
  public quantity!: number
}

DishIngredient.init(
  {
    dish_id: {
      type: DataTypes.UUID,
      allowNull: false,
      primaryKey: true,
      references: {
        model: "dishes",
        key: "id",
      },
      onDelete: "CASCADE",
    },
    ingredient_id: {
      type: DataTypes.UUID,
      allowNull: false,
      primaryKey: true,
      references: {
        model: "ingredients",
        key: "id",
      },
      onDelete: "CASCADE",
    },
    quantity: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: "dish_ingredients",
    timestamps: false,
  },
)

export default DishIngredient
