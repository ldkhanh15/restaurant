import { BlogPostAttributes } from "../../models/blogPost.model";

export interface CreateBlogPostDTO {
  title: string;
  content: string;
  author_id: string;
  excerpt?: string;
  featured_image?: string;
  tags?: string[];
  category?: string;
  status?: BlogPostAttributes["status"];
  published_at?: Date;
  seo_title?: string;
  seo_description?: string;
  seo_keywords?: string[];
}

export interface UpdateBlogPostDTO extends Partial<CreateBlogPostDTO> {}
