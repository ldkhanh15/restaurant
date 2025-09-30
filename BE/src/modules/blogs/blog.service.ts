import { BlogPost, User } from "../../models/index";
import { v4 as uuidv4 } from "uuid";
import {
  CreateBlogPostDTO,
  UpdateBlogPostDTO,
} from "../../types/dtos/blog.dto";

export const BlogPostService = {
  async list() {
    return BlogPost.findAll({
      include: [
        {
          model: User,
          as: "author",
          attributes: ["id", "full_name", "email"],
        },
      ],
      order: [["created_at", "DESC"]],
    });
  },

  async get(id: string) {
    return BlogPost.findByPk(id, {
      include: [
        {
          model: User,
          as: "author",
          attributes: ["id", "full_name", "email"],
        },
      ],
    });
  },

  async create(payload: CreateBlogPostDTO) {
    const id = payload.id || uuidv4();
    const post = await BlogPost.create({
      id,
      ...payload,
      status: payload.status || "draft",
      created_at: new Date(),
      updated_at: new Date(),
    });
    return this.get(post.id);
  },

  async update(id: string, payload: UpdateBlogPostDTO) {
    const post = await BlogPost.findByPk(id);
    if (!post) return null;

    await post.update({
      ...payload,
      updated_at: new Date(),
    });
    return this.get(id);
  },

  async publish(id: string) {
    const post = await BlogPost.findByPk(id);
    if (!post) return null;

    await post.update({
      status: "published",
      published_at: new Date(),
      updated_at: new Date(),
    });
    return this.get(id);
  },

  async remove(id: string) {
    const post = await BlogPost.findByPk(id);
    if (!post) return false;
    await post.destroy();
    return true;
  },
};
