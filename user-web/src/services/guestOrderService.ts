import apiClient from "@/lib/apiClient";

export interface GuestOrder {
  id: string;
  table_id: string;
  status: string;
  total_amount: number;
  final_amount: number;
  payment_status?: string;
  items?: GuestOrderItem[];
  voucher?: any;
  created_at?: string;
  updated_at?: string;
}

export interface GuestOrderItem {
  id: string;
  dish_id: string;
  quantity: number;
  price: number;
  status: string;
  dish?: {
    id: string;
    name: string;
    price: number;
    media_urls?: string[];
    description?: string;
  };
}

export interface GuestOrderResponse {
  status: string;
  data: GuestOrder;
}

/**
 * Guest Order Service
 * Handles all order operations for walk-in customers (guests)
 * Uses /api/guest/order/* endpoints
 */
const guestOrderService = {
  // Get current order for table
  getCurrentOrder: (tableId: string): Promise<GuestOrderResponse> =>
    apiClient.get(`/guest/order/current?table_id=${tableId}`),

  // Add item to order (creates order if not exists)
  addItem: (
    tableId: string,
    data: { dish_id: string; quantity: number }
  ): Promise<GuestOrderResponse> =>
    apiClient.post("/guest/order/add-item", {
      table_id: tableId,
      ...data,
    }),

  // Update item quantity
  updateItemQuantity: (
    tableId: string,
    itemId: string,
    quantity: number
  ): Promise<GuestOrderResponse> =>
    apiClient.put("/guest/order/update-item-quantity", {
      table_id: tableId,
      item_id: itemId,
      quantity,
    }),

  // Update item status (for admin)
  updateItemStatus: (
    tableId: string,
    itemId: string,
    status: string
  ): Promise<GuestOrderResponse> =>
    apiClient.put("/guest/order/update-item-status", {
      table_id: tableId,
      item_id: itemId,
      status,
    }),

  // Remove item
  removeItem: (tableId: string, itemId: string): Promise<GuestOrderResponse> =>
    apiClient.delete(
      `/guest/order/remove-item?table_id=${tableId}&item_id=${itemId}`
    ),

  // Apply voucher
  applyVoucher: (
    tableId: string,
    voucherCode: string
  ): Promise<GuestOrderResponse> =>
    apiClient.post("/guest/order/apply-voucher", {
      table_id: tableId,
      voucher_code: voucherCode,
    }),

  // Remove voucher
  removeVoucher: (tableId: string): Promise<GuestOrderResponse> =>
    apiClient.delete(`/guest/order/remove-voucher?table_id=${tableId}`),

  // Request support
  requestSupport: (
    tableId: string
  ): Promise<{ status: string; data: { message: string } }> =>
    apiClient.post("/guest/order/request-support", {
      table_id: tableId,
    }),

  // Request payment
  requestPayment: (
    tableId: string,
    data: {
      method?: "vnpay" | "cash";
      points_used?: number;
    } = {}
  ): Promise<
    GuestOrderResponse & {
      data: {
        redirect_url?: string;
        vat_amount?: number;
        points_used?: number;
        final_payment_amount?: number;
      };
    }
  > =>
    apiClient.post("/guest/order/request-payment", {
      table_id: tableId,
      ...data,
    }),

  // Request payment retry
  requestPaymentRetry: (
    tableId: string,
    method: "vnpay" | "cash",
    data?: {
      points_used?: number;
      note?: string;
    }
  ): Promise<
    GuestOrderResponse & {
      data: {
        redirect_url?: string;
        vat_amount?: number;
        points_used?: number;
        final_payment_amount?: number;
      };
    }
  > =>
    apiClient.post("/guest/order/request-payment-retry", {
      table_id: tableId,
      method,
      ...data,
    }),

  // Request cash payment
  requestCashPayment: (
    tableId: string,
    data?: {
      note?: string;
      points_used?: number;
    }
  ): Promise<
    GuestOrderResponse & {
      data: {
        vat_amount?: number;
        points_used?: number;
        final_payment_amount?: number;
      };
    }
  > =>
    apiClient.post("/guest/order/request-cash-payment", {
      table_id: tableId,
      ...data,
    }),
};

export default guestOrderService;
