import { User } from "./User";

export type Employee = {
  id: string;
  user_id?: string;
  position?: string;
  face_image_url?: string;
  created_at?: Date;
  deleted_at?: Date | null;
  user?: User;
};
