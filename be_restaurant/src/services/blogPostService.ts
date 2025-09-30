import { BaseService } from "./baseService"
import BlogPost from "../models/BlogPost"

class BlogPostService extends BaseService<BlogPost> {
  constructor() {
    super(BlogPost)
  }

  async findPublishedPosts() {
    return await this.model.findAll({
      where: { status: "published" },
      order: [["publishedAt", "DESC"]],
    })
  }
}

export default new BlogPostService()
