import { DataTypes, Model, Optional, Sequelize } from "sequelize";

export interface ReviewAttributes {
  id: string;
  user_id?: string | null;
  order_id?: string | null;
  dish_id?: string | null;
  rating?: number | null;
  comment?: string | null;
  created_at?: Date;
}

type ReviewCreation = Optional<
  ReviewAttributes,
  "id" | "rating" | "comment" | "created_at"
>;

export class Review
  extends Model<ReviewAttributes, ReviewCreation>
  implements ReviewAttributes
{
  public id!: string;
  public user_id!: string | null;
  public order_id!: string | null;
  public dish_id!: string | null;
  public rating!: number | null;
  public comment!: string | null;
  public created_at!: Date;
}

export function initReviewModel(sequelize: Sequelize) {
  Review.init(
    {
      id: { type: DataTypes.CHAR(36), primaryKey: true },
      user_id: { type: DataTypes.CHAR(36), allowNull: true },
      order_id: { type: DataTypes.CHAR(36), allowNull: true },
      dish_id: { type: DataTypes.CHAR(36), allowNull: true },
      rating: {
        type: DataTypes.INTEGER,
        allowNull: true,
        validate: {
          min: 1,
          max: 5,
        },
      },
      comment: { type: DataTypes.TEXT, allowNull: true },
      created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    },
    {
      sequelize,
      tableName: "reviews",
      timestamps: false,
    }
  );
}
