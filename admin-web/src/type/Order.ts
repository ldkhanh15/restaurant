export type Order = {
  id: string;
  user_id?: string;
  reservation_id?: string;
  table_id?: string;
  table_group_id?: string;
  event_id?: string;
  voucher_id?: string;
  status:
    | "pending"
    | "dining"
    | "waiting_payment"
    | "preparing"
    | "ready"
    | "delivered"
    | "paid"
    | "cancelled";
  total_amount: number;
  voucher_discount_amount?: number;
  final_amount: number;
  event_fee?: number;
  deposit_amount?: number;
  customizations?: any;
  notes?: string;
  payment_status: "pending" | "paid" | "failed";
  payment_method?: "zalopay" | "momo" | "cash" | "vnpay";
  created_at?: Date;
  updated_at?: Date;
  deleted_at?: Date | null;
};
