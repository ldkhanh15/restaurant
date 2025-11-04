export interface MockOrderItem {
  id: string;
  dish_id: string;
  dish_name: string;
  quantity: number;
  price: number;
  status: "preparing" | "served" | "cancelled";
}

export interface MockOrder {
  id: string;
  date: string;
  status: "preparing" | "serving" | "completed" | "cancelled";
  table_id?: string;
  table_name?: string;
  reservation_id?: string;
  items: MockOrderItem[];
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  payment_method?: string;
  voucher_code?: string;
  paid: boolean;
}

export const mockOrders: MockOrder[] = [
  {
    id: "ORD-001",
    date: "2024-02-15T19:00:00Z",
    status: "preparing",
    table_id: "T-12",
    table_name: "Bàn 12",
    reservation_id: "RES-123456",
    items: [
      {
        id: "I-1",
        dish_id: "dish-1",
        dish_name: "Cá Hồi Nướng",
        quantity: 2,
        price: 350000,
        status: "preparing",
      },
      {
        id: "I-2",
        dish_id: "dish-3",
        dish_name: "Salad Caesar",
        quantity: 1,
        price: 120000,
        status: "served",
      },
      {
        id: "I-3",
        dish_id: "dish-4",
        dish_name: "Soup Gà",
        quantity: 1,
        price: 150000,
        status: "preparing",
      },
    ],
    subtotal: 970000,
    discount: 50000,
    tax: 97000,
    total: 1017000,
    payment_method: "vnpay",
    voucher_code: "MAISON20",
    paid: false,
  },
  {
    id: "ORD-002",
    date: "2024-02-10T18:30:00Z",
    status: "completed",
    table_id: "T-8",
    table_name: "Bàn 8",
    items: [
      {
        id: "I-4",
        dish_id: "dish-2",
        dish_name: "Bò Beefsteak Úc",
        quantity: 1,
        price: 450000,
        status: "served",
      },
      {
        id: "I-5",
        dish_id: "dish-5",
        dish_name: "Bánh Chocolate Fondant",
        quantity: 1,
        price: 120000,
        status: "served",
      },
    ],
    subtotal: 570000,
    discount: 0,
    tax: 57000,
    total: 627000,
    payment_method: "momo",
    paid: true,
  },
];

export const getOrderById = (id: string): MockOrder | undefined => {
  return mockOrders.find((order) => order.id === id);
};

export const getOrdersByTable = (tableId: string): MockOrder[] => {
  return mockOrders.filter((order) => order.table_id === tableId);
};
