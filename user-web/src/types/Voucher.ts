export type Voucher = {
  id: string;
  code: string;
  discount_type: "percentage" | "fixed";
  value: string | number;
  min_order_value: number | null;
  current_uses: number;
  max_uses: number;
  active: boolean;
  created_at: string | null;
  expiry_date?: string | null;
  deleted_at?: string | null;
};