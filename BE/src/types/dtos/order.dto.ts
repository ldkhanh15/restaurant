import { OrderAttributes } from "../../models/order.model";
import { OrderItemAttributes } from "../../models/orderItem.model";

export interface CreateOrderDTO {
  user_id?: string;
  reservation_id?: string;
  table_id?: string;
  table_group_id?: string;
  voucher_id?: string;
  status?: OrderAttributes["status"];
  total_amount: number;
  customizations?: object;
  notes?: string;
  payment_status?: OrderAttributes["payment_status"];
  payment_method?: OrderAttributes["payment_method"];
  items?: CreateOrderItemDTO[];
}

export interface UpdateOrderDTO extends Partial<CreateOrderDTO> {}

export interface CreateOrderItemDTO {
  dish_id: string;
  quantity: number;
  price: number;
  customizations?: object;
  status?: OrderItemAttributes["status"];
  estimated_wait_time?: number;
}

export interface UpdateOrderItemDTO extends Partial<CreateOrderItemDTO> {}
