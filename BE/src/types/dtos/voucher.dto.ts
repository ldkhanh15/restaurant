import { VoucherAttributes } from "../../models/voucher.model";
import { VoucherUsageAttributes } from "../../models/voucherUsage.model";

export interface CreateVoucherDTO {
  code: string;
  discount_type: "percentage" | "fixed";
  value: number;
  expiry_date?: Date;
  max_uses?: number;
  min_order_value?: number;
  active?: boolean;
}

export interface UpdateVoucherDTO extends Partial<CreateVoucherDTO> {}

export interface CreateVoucherUsageDTO {
  voucher_id: string;
  order_id?: string;
  user_id?: string;
}

export interface UpdateVoucherUsageDTO extends Partial<CreateVoucherUsageDTO> {}
