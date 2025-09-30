import { DataTypes, Model, Optional, Sequelize } from "sequelize";

export interface DishIngredientAttributes {
  dish_id: string;
  ingredient_id: string;
  quantity: number;
}

type DishIngredientCreation = Optional<DishIngredientAttributes, never>;

export class DishIngredient
  extends Model<DishIngredientAttributes, DishIngredientCreation>
  implements DishIngredientAttributes
{
  public dish_id!: string;
  public ingredient_id!: string;
  public quantity!: number;
}

export function initDishIngredientModel(sequelize: Sequelize) {
  DishIngredient.init(
    {
      dish_id: {
        type: DataTypes.CHAR(36),
        primaryKey: true,
        references: {
          model: "dishes",
          key: "id",
        },
      },
      ingredient_id: {
        type: DataTypes.CHAR(36),
        primaryKey: true,
        references: {
          model: "ingredients",
          key: "id",
        },
      },
      quantity: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    },
    {
      sequelize,
      tableName: "dish_ingredients",
      timestamps: false,
      indexes: [
        {
          name: "idx_dish_ingredients",
          fields: ["dish_id", "ingredient_id"],
        },
      ],
    }
  );
}
