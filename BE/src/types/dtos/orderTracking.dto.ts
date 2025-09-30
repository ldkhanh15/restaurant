import { OrderItemLogAttributes } from "../../models/orderItemLog.model";

export interface OrderItemStatusChangeDTO {
  order_item_id: string;
  old_status: string;
  new_status: string;
  changed_by?: string;
  reason?: string;
  estimated_time?: number;
}

export interface OrderStatusUpdateDTO {
  order_id: string;
  new_status: string;
  updated_by?: string;
  notes?: string;
  notify_customer?: boolean;
}

export interface OrderItemLogDTO {
  order_item_id: string;
  action:
    | "status_change"
    | "quantity_change"
    | "customization_change"
    | "price_change";
  old_value: any;
  new_value: any;
  changed_by?: string;
  reason?: string;
  metadata?: object;
}

export interface OrderTrackingEventDTO {
  order_id: string;
  event_type: string;
  event_data?: object;
  timestamp: Date;
  actor_id?: string;
  actor_type?: "system" | "employee" | "customer";
  location?: string;
}
