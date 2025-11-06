import { BaseService } from "./baseService";
import BlogPost from "../models/BlogPost";
import { FindOptions } from "sequelize/types/model";
import { User } from "../models";

class BlogPostService extends BaseService<BlogPost> {
  constructor() {
    super(BlogPost);
  }

  async findPublishedPosts() {
    return await this.model.findAll({
      where: { status: "published" },
      order: [["published_at", "DESC"]],
    });
  }

  async getAllBlogPosts(options = {}) {
    console.log("Fetching all blog posts with options:", options);
    return await this.findAll({
      ...options,
      include: [
        {
          model: User,
          as: "author",
          attributes: ["id", "username", "email"],
        },
      ],
    });
  }
}

export default new BlogPostService();
