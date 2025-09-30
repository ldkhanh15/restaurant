import { DataTypes, Model, type Optional } from "sequelize"
import sequelize from "../config/database"

interface BlogPostAttributes {
  id: string
  title: string
  content: string
  images?: any
  author_id?: string
  status: "draft" | "published"
  published_at?: Date
  created_at?: Date
}

interface BlogPostCreationAttributes extends Optional<BlogPostAttributes, "id" | "status"> {}

class BlogPost extends Model<BlogPostAttributes, BlogPostCreationAttributes> implements BlogPostAttributes {
  public id!: string
  public title!: string
  public content!: string
  public images?: any
  public author_id?: string
  public status!: "draft" | "published"
  public published_at?: Date
  public created_at?: Date
}

BlogPost.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    title: {
      type: DataTypes.STRING(200),
      allowNull: false,
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    images: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    author_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: "users",
        key: "id",
      },
      onDelete: "SET NULL",
    },
    status: {
      type: DataTypes.ENUM("draft", "published"),
      defaultValue: "draft",
    },
    published_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    tableName: "blog_posts",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: false,
  },
)

export default BlogPost
