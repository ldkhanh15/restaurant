import { DataTypes, Model, Optional, Sequelize } from "sequelize";

export interface UserPreferenceAttributes {
  id: string;
  user_id: string;
  theme?: "light" | "dark" | null;
  language?: string | null;
  notification_settings?: object | null;
  dietary_preferences?: string[] | null;
  favorite_dishes?: string[] | null;
  created_at?: Date;
  updated_at?: Date;
}

type UserPreferenceCreation = Optional<
  UserPreferenceAttributes,
  | "id"
  | "theme"
  | "language"
  | "notification_settings"
  | "dietary_preferences"
  | "favorite_dishes"
  | "created_at"
  | "updated_at"
>;

export class UserPreference
  extends Model<UserPreferenceAttributes, UserPreferenceCreation>
  implements UserPreferenceAttributes
{
  public id!: string;
  public user_id!: string;
  public theme!: "light" | "dark" | null;
  public language!: string | null;
  public notification_settings!: object | null;
  public dietary_preferences!: string[] | null;
  public favorite_dishes!: string[] | null;
  public created_at!: Date;
  public updated_at!: Date;
}

export function initUserPreferenceModel(sequelize: Sequelize) {
  UserPreference.init(
    {
      id: { type: DataTypes.CHAR(36), primaryKey: true },
      user_id: {
        type: DataTypes.CHAR(36),
        allowNull: false,
        references: {
          model: "users",
          key: "id",
        },
      },
      theme: {
        type: DataTypes.ENUM("light", "dark"),
        defaultValue: "light",
      },
      language: {
        type: DataTypes.STRING(10),
        defaultValue: "en",
      },
      notification_settings: {
        type: DataTypes.JSON,
        defaultValue: {
          email: true,
          push: true,
          sms: false,
        },
      },
      dietary_preferences: {
        type: DataTypes.ARRAY(DataTypes.STRING),
        defaultValue: [],
      },
      favorite_dishes: {
        type: DataTypes.ARRAY(DataTypes.STRING),
        defaultValue: [],
      },
      created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
      updated_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    },
    {
      sequelize,
      tableName: "user_preferences",
      timestamps: false,
      indexes: [
        {
          unique: true,
          fields: ["user_id"],
        },
      ],
    }
  );
}
