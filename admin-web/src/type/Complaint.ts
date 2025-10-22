import { Order } from "./Order";
import { User } from "./User";

export type Complaint = {
  id: string;
  user_id?: string;
  order_id?: string;
  order_item_id?: string;
  description: string;
  status: "pending" | "approved" | "rejected";
  resolution_notes?: string;
  created_at: Date;
  updated_at?: Date;
  order?: Order;
  user?: User;
};
