export type Dish = {
  id: string;
  name: string;
  description?: string;
  price: number;
  category_id: string;
  media_urls?: any;
  is_best_seller: boolean;
  seasonal: boolean;
  active: boolean;
  created_at?: Date;
  updated_at?: Date;
  deleted_at?: Date | null;
};
