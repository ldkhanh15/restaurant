import { User } from "./User";

export type BlogPost = {
  id: string;
  title: string;
  content: string;
  author_id?: string;
  thumbnail_url?: string;
  tags?: any;
  category?: string;
  status: "draft" | "published" | "deleted";
  published_at?: Date;
  meta_description?: string;
  created_at?: Date;
  author?: User;
};
