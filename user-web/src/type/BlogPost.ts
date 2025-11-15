import { User } from "./User.js";

export type BlogPost = {
  id: string;
  title: string;
  content: string; // HTML
  author_id?: string;
  thumbnail_url?: string;
  category?: string;
  status: "draft" | "published" | "deleted";
  published_at?: Date;
  meta_description?: string;
  created_at?: Date;
  updated_at?: Date;
  author?: User;
};
