import { ReservationDraft } from "@/store/reservationStore";

export interface MockReservation {
  id: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  num_people: number;
  date: string;
  time: string;
  table_id: string;
  table_name: string;
  floor: string;
  status: "pending" | "confirmed" | "checked_in" | "completed" | "cancelled";
  special_requests?: string;
  event_type?: string;
  deposit_paid: number;
  total_cost: number;
  created_at: string;
  modified_at?: string;
  checked_in?: boolean;
  pre_orders?: Array<{
    id: string;
    dish_id: string;
    dish_name: string;
    quantity: number;
    price: number;
  }>;
}

export const mockReservations: MockReservation[] = [
  {
    id: "RES-123456",
    customer_name: "Nguyễn Văn An",
    customer_phone: "0901234567",
    customer_email: "an.nguyen@email.com",
    num_people: 4,
    date: "2024-02-15",
    time: "19:00",
    table_id: "T-12",
    table_name: "Bàn 12",
    floor: "Tầng 2",
    status: "confirmed",
    special_requests: "Gần cửa sổ, khu vực yên tĩnh",
    event_type: "birthday",
    deposit_paid: 500000,
    total_cost: 2500000,
    created_at: "2024-01-20T10:00:00Z",
    modified_at: "2024-01-21T14:30:00Z",
    checked_in: false,
    pre_orders: [
      {
        id: "PO-1",
        dish_id: "dish-1",
        dish_name: "Cá Hồi Nướng",
        quantity: 2,
        price: 350000,
      },
      {
        id: "PO-2",
        dish_id: "dish-3",
        dish_name: "Salad Caesar",
        quantity: 2,
        price: 120000,
      },
    ],
  },
];

export const createReservationFromDraft = (
  draft: ReservationDraft,
  reservationId: string
): MockReservation => {
  return {
    id: reservationId,
    customer_name: draft.customer_name,
    customer_phone: draft.customer_phone,
    customer_email: draft.customer_email,
    num_people: draft.num_people,
    date: draft.date
      ? draft.date.toISOString().split("T")[0]
      : new Date().toISOString().split("T")[0],
    time: draft.time,
    table_id: draft.selected_table_id || "",
    table_name: draft.selected_table_name || "",
    floor: draft.selected_floor || "",
    status: "pending",
    special_requests: draft.special_requests,
    event_type: draft.event_type || undefined,
    deposit_paid: draft.deposit_amount,
    total_cost: calculateTotalCost(draft),
    created_at: new Date().toISOString(),
    pre_orders: draft.pre_orders.map((po, index) => ({
      id: `PO-${index + 1}`,
      dish_id: po.dish_id,
      dish_name: po.dish_name,
      quantity: po.quantity,
      price: po.price,
    })),
  };
};

const calculateTotalCost = (draft: ReservationDraft): number => {
  let total = 0;

  // Event cost
  if (draft.event_type && draft.event_type !== "none") {
    const eventCosts: Record<string, number> = {
      birthday: 200000,
      anniversary: 150000,
      celebration: 300000,
    };
    total += eventCosts[draft.event_type] || 0;
  }

  // Pre-order dishes
  total += draft.pre_orders.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  // Apply voucher discount
  total -= draft.voucher_discount || 0;

  return total;
};

export const getReservationById = (id: string): MockReservation | undefined => {
  return mockReservations.find((res) => res.id === id);
};
