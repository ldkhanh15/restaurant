import { User } from "./User";

export type BlogPost = {
  id: string;
  title: string;
  content: string;
  images?: any;
  author_id?: string;
  slug?: string;
  thumbnail_url?: string;
  cover_image_url?: string;
  tags?: any;
  category?: string;
  status: "draft" | "published" | "deleted";
  published_at?: Date;
  meta_title?: string;
  meta_description?: string;
  created_at?: Date;
  author?: User;
};
