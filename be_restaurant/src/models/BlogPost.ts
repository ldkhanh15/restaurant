import { DataTypes, Model, type Optional } from "sequelize"
import sequelize from "../config/database"

interface BlogPostAttributes {
  id: string
  title: string
  content: string
  images?: any
  author_id?: string
  slug?: string
  thumbnail_url?: string
  cover_image_url?: string
  tags?: any
  category?: string
  status: "draft" | "published" | "deleted"
  published_at?: Date
  meta_title?: string
  meta_description?: string
  keywords?: any
  created_at?: Date
}

interface BlogPostCreationAttributes extends Optional<BlogPostAttributes, "id" | "status"> { }

class BlogPost extends Model<BlogPostAttributes, BlogPostCreationAttributes> implements BlogPostAttributes {
  public id!: string
  public title!: string
  public content!: string
  public images?: any
  public author_id?: string
  public slug?: string
  public thumbnail_url?: string
  public cover_image_url?: string
  public tags?: any
  public category?: string
  public status!: "draft" | "published" | "deleted"
  public published_at?: Date
  public meta_title?: string
  public meta_description?: string
  public keywords?: any
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
      type: DataTypes.TEXT('long'),
      allowNull: false,
    },
    images: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    slug: {
      type: DataTypes.STRING(220),
      allowNull: true,
      unique: false,
    },
    thumbnail_url: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    cover_image_url: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    tags: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    category: {
      type: DataTypes.STRING(100),
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
      type: DataTypes.ENUM("draft", "published", "deleted"),
      defaultValue: "draft",
    },
    published_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    meta_title: {
      type: DataTypes.STRING(200),
      allowNull: true,
    },
    meta_description: {
      type: DataTypes.STRING(300),
      allowNull: true,
    },
    keywords: {
      type: DataTypes.JSON,
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
