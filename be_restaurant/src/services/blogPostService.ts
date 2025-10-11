import { BaseService } from "./baseService"
import BlogPost from "../models/BlogPost"

class BlogPostService extends BaseService<BlogPost> {
  constructor() {
    super(BlogPost)
  }

  async findPublishedPosts() {
    return await this.model.findAll({
      where: { status: "published" },
      order: [["published_at", "DESC"]],
    })
  }
}

export default new BlogPostService()
