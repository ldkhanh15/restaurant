export type Review = {
  id: string;
  user_id?: string;
  order_id?: string;
  table_id?: string;
  order_item_id?: string;
  dish_id?: string;
  type: "dish" | "table";
  rating: number;
  comment?: string;
  created_at?: Date;
};

export type CreateReviewData = {
  user_id?: string;
  order_id?: string;
  table_id?: string;
  order_item_id?: string;
  dish_id?: string;
  type: "dish" | "table";
  rating: number;
  comment?: string;
};