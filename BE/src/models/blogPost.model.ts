import { DataTypes, Model, Optional, Sequelize } from "sequelize";

export interface BlogPostAttributes {
  id: string;
  title: string;
  content: string;
  images?: object | null;
  author_id?: string | null;
  status?: "draft" | "published";
  published_at?: Date | null;
  created_at?: Date;
}

type BlogPostCreation = Optional<
  BlogPostAttributes,
  "id" | "images" | "status" | "published_at" | "created_at"
>;

export class BlogPost
  extends Model<BlogPostAttributes, BlogPostCreation>
  implements BlogPostAttributes
{
  public id!: string;
  public title!: string;
  public content!: string;
  public images!: object | null;
  public author_id!: string | null;
  public status!: "draft" | "published";
  public published_at!: Date | null;
  public created_at!: Date;
}

export function initBlogPostModel(sequelize: Sequelize) {
  BlogPost.init(
    {
      id: { type: DataTypes.CHAR(36), primaryKey: true },
      title: { type: DataTypes.STRING(200), allowNull: false },
      content: { type: DataTypes.TEXT, allowNull: false },
      images: { type: DataTypes.JSON, allowNull: true },
      author_id: { type: DataTypes.CHAR(36), allowNull: true },
      status: {
        type: DataTypes.ENUM("draft", "published"),
        defaultValue: "draft",
      },
      published_at: { type: DataTypes.DATE, allowNull: true },
      created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    },
    {
      sequelize,
      tableName: "blog_posts",
      timestamps: false,
    }
  );
}
