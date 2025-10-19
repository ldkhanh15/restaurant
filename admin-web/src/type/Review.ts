import { User } from "./User";
import { Order } from "./Order";
import { Dish } from "./Dish";
import { Table } from "./Table";
export interface Review {
  id: string;
  user_id?: string;
  order_id?: string;
  dish_id?: string;
  rating: number;
  comment?: string;
  created_at: Date;
  order_item_id?: string;
  table_id?: string;
  type: "dish" | "table";
  user?: User;
  order?: Order;
  dish?: Dish;
  table?: Table;
}
