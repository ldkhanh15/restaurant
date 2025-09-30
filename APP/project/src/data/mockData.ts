export interface User {
  id: string;
  username: string;
  email: string;
  phone?: string;
  role: 'customer';
  full_name: string;
  preferences: {
    allergies?: string[];
    favorite_dishes?: string[];
    preferred_location?: 'near_window' | 'garden';
  };
  ranking: 'regular' | 'vip' | 'platinum';
  points: number;
}

export interface Category {
  id: string;
  name: string;
}

export interface Dish {
  id: string;
  name: string;
  description: string;
  price: number;
  category_id: string;
  media_urls: string[];
  is_best_seller: boolean;
  seasonal: boolean;
  active: boolean;
}

export interface Ingredient {
  id: string;
  name: string;
  unit: string;
  current_stock: number;
}

export interface DishIngredient {
  dish_id: string;
  ingredient_id: string;
  quantity: number;
}

export interface Table {
  id: string;
  table_number: string;
  capacity: number;
  location: 'near_window' | 'garden';
  status: 'available' | 'reserved';
  panorama_urls: string[];
  amenities: string[];
}

export interface TableGroup {
  id: string;
  group_name: string;
  table_ids: string[];
  total_capacity: number;
}

export interface Reservation {
  id: string;
  user_id: string;
  table_id?: string;
  table_group_id?: string;
  reservation_time: string;
  num_people: number;
  preferences: Record<string, any>;
  status: 'pending' | 'confirmed' | 'cancelled';
}

export interface OrderItem {
  dish_id: string;
  quantity: number;
  price: number;
  customizations?: Record<string, any>;
}

export interface Order {
  id: string;
  user_id: string;
  reservation_id?: string;
  table_id?: string;
  status: 'pending' | 'preparing' | 'ready' | 'delivered';
  total_amount: number;
  payment_method: 'zalopay' | 'momo' | 'cash' | 'card';
  items: OrderItem[];
  created_at: string;
}

export interface Voucher {
  id: string;
  code: string;
  discount_type: 'percentage' | 'fixed';
  value: number;
  expiry_date: string;
  active: boolean;
  min_amount?: number;
}

export interface Review {
  id: string;
  user_id: string;
  order_id?: string;
  dish_id?: string;
  rating: number;
  comment: string;
  created_at: string;
}

export interface BlogPost {
  id: string;
  title: string;
  content: string;
  images: string[];
  status: 'published' | 'draft';
  created_at: string;
}

export interface ChatMessage {
  sender_type: 'user' | 'bot';
  message_text: string;
  timestamp: string;
}

export interface ChatSession {
  id: string;
  user_id: string;
  messages: ChatMessage[];
}

export interface Notification {
  id: string;
  user_id: string;
  type: 'reservation_confirm' | 'order_ready' | 'promotion';
  content: string;
  read: boolean;
  created_at: string;
}

// Mock Data
export const mockUsers: User[] = [
  {
    id: 'user-1',
    username: 'john_doe',
    email: 'john@example.com',
    phone: '+1234567890',
    role: 'customer',
    full_name: 'John Doe',
    preferences: {
      allergies: ['nuts'],
      favorite_dishes: ['dish-1', 'dish-3'],
      preferred_location: 'near_window'
    },
    ranking: 'vip',
    points: 500
  },
  {
    id: 'user-2',
    username: 'jane_smith',
    email: 'jane@example.com',
    role: 'customer',
    full_name: 'Jane Smith',
    preferences: {
      allergies: ['shellfish'],
      preferred_location: 'garden'
    },
    ranking: 'platinum',
    points: 1200
  }
];

export const mockCategories: Category[] = [
  { id: 'cat-1', name: 'Appetizers' },
  { id: 'cat-2', name: 'Main Course' },
  { id: 'cat-3', name: 'Desserts' },
  { id: 'cat-4', name: 'Beverages' }
];

export const mockDishes: Dish[] = [
  {
    id: 'dish-1',
    name: 'Grilled Salmon with Truffle',
    description: 'Premium Atlantic salmon grilled to perfection with rare black truffles and herb butter',
    price: 150000,
    category_id: 'cat-2',
    media_urls: ['https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=500'],
    is_best_seller: true,
    seasonal: false,
    active: true
  },
  {
    id: 'dish-2',
    name: 'Beluga Caviar Tasting',
    description: 'Exquisite Beluga caviar served with traditional accompaniments',
    price: 280000,
    category_id: 'cat-1',
    media_urls: ['https://images.unsplash.com/photo-1544025162-d76694265947?w=500'],
    is_best_seller: true,
    seasonal: false,
    active: true
  },
  {
    id: 'dish-3',
    name: 'Wagyu Beef Tenderloin',
    description: 'Grade A5 Japanese Wagyu beef tenderloin with seasonal vegetables',
    price: 320000,
    category_id: 'cat-2',
    media_urls: ['https://images.unsplash.com/photo-1558030006-450675393462?w=500'],
    is_best_seller: true,
    seasonal: false,
    active: true
  },
  {
    id: 'dish-4',
    name: 'Chocolate Soufflé',
    description: 'Decadent dark chocolate soufflé with gold leaf and vanilla ice cream',
    price: 85000,
    category_id: 'cat-3',
    media_urls: ['https://images.unsplash.com/photo-1551024506-0bccd828d307?w=500'],
    is_best_seller: false,
    seasonal: false,
    active: true
  },
  {
    id: 'dish-5',
    name: 'Dom Pérignon Vintage',
    description: '2012 vintage champagne, perfectly aged',
    price: 450000,
    category_id: 'cat-4',
    media_urls: ['https://images.unsplash.com/photo-1547595628-c61a29f496f0?w=500'],
    is_best_seller: false,
    seasonal: false,
    active: true
  }
];

export const mockIngredients: Ingredient[] = [
  { id: 'ing-1', name: 'Atlantic Salmon', unit: 'kg', current_stock: 10 },
  { id: 'ing-2', name: 'Black Truffle', unit: 'g', current_stock: 50 },
  { id: 'ing-3', name: 'Wagyu Beef', unit: 'kg', current_stock: 5 },
  { id: 'ing-4', name: 'Beluga Caviar', unit: 'g', current_stock: 25 }
];

export const mockTables: Table[] = [
  {
    id: 'table-1',
    table_number: 'T1',
    capacity: 4,
    location: 'near_window',
    status: 'available',
    panorama_urls: ['https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=500'],
    amenities: ['wifi', 'sea_view', 'wine_cellar_access']
  },
  {
    id: 'table-2',
    table_number: 'T2',
    capacity: 2,
    location: 'garden',
    status: 'available',
    panorama_urls: ['https://images.unsplash.com/photo-1552566591-349935b4a972?w=500'],
    amenities: ['garden_view', 'private_entrance']
  },
  {
    id: 'table-3',
    table_number: 'T3',
    capacity: 8,
    location: 'near_window',
    status: 'reserved',
    panorama_urls: ['https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=500'],
    amenities: ['private_dining', 'wine_pairing_service']
  }
];

export const mockReservations: Reservation[] = [
  {
    id: 'res-1',
    user_id: 'user-1',
    table_id: 'table-1',
    reservation_time: '2025-01-20T19:00:00',
    num_people: 4,
    preferences: { special_occasion: 'anniversary' },
    status: 'confirmed'
  }
];

export const mockOrders: Order[] = [
  {
    id: 'order-1',
    user_id: 'user-1',
    reservation_id: 'res-1',
    table_id: 'table-1',
    status: 'delivered',
    total_amount: 470000,
    payment_method: 'card',
    items: [
      { dish_id: 'dish-1', quantity: 1, price: 150000 },
      { dish_id: 'dish-2', quantity: 1, price: 280000 },
      { dish_id: 'dish-4', quantity: 1, price: 85000, customizations: { extra_ice_cream: true } }
    ],
    created_at: '2025-01-15T18:30:00'
  }
];

export const mockVouchers: Voucher[] = [
  {
    id: 'voucher-1',
    code: 'LUXURY10',
    discount_type: 'percentage',
    value: 10,
    expiry_date: '2025-12-31',
    active: true,
    min_amount: 200000
  },
  {
    id: 'voucher-2',
    code: 'VIP50',
    discount_type: 'fixed',
    value: 50000,
    expiry_date: '2025-06-30',
    active: true,
    min_amount: 300000
  }
];

export const mockReviews: Review[] = [
  {
    id: 'review-1',
    user_id: 'user-1',
    dish_id: 'dish-1',
    rating: 5,
    comment: 'Absolutely exquisite! The salmon was perfectly cooked and the truffle added an incredible depth of flavor.',
    created_at: '2025-01-16T10:00:00'
  },
  {
    id: 'review-2',
    user_id: 'user-2',
    dish_id: 'dish-3',
    rating: 5,
    comment: 'The Wagyu was melt-in-your-mouth tender. Best dining experience ever!',
    created_at: '2025-01-14T15:30:00'
  }
];

export const mockBlogPosts: BlogPost[] = [
  {
    id: 'blog-1',
    title: 'New Seasonal Menu Unveiled',
    content: 'We are thrilled to present our new seasonal menu featuring the finest ingredients sourced from around the world. Our head chef has crafted unique dishes that celebrate the essence of luxury dining...',
    images: ['https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=500'],
    status: 'published',
    created_at: '2025-01-10T09:00:00'
  },
  {
    id: 'blog-2',
    title: 'Wine Pairing Excellence',
    content: 'Discover the art of perfect wine pairing with our sommelier-selected collection. Each wine is carefully chosen to complement our signature dishes...',
    images: ['https://images.unsplash.com/photo-1547595628-c61a29f496f0?w=500'],
    status: 'published',
    created_at: '2025-01-08T14:00:00'
  }
];

export const mockNotifications: Notification[] = [
  {
    id: 'notif-1',
    user_id: 'user-1',
    type: 'reservation_confirm',
    content: 'Your table reservation for January 20th at 7:00 PM has been confirmed.',
    read: false,
    created_at: '2025-01-15T12:00:00'
  },
  {
    id: 'notif-2',
    user_id: 'user-1',
    type: 'promotion',
    content: 'New VIP voucher available! Use code VIP50 for ₫50,000 off your next order.',
    read: true,
    created_at: '2025-01-12T16:00:00'
  }
];

export const mockChatSessions: ChatSession[] = [
  {
    id: 'chat-1',
    user_id: 'user-1',
    messages: [
      {
        sender_type: 'user',
        message_text: 'Show me the menu',
        timestamp: '2025-01-15T10:00:00'
      },
      {
        sender_type: 'bot',
        message_text: 'Here are our signature dishes: Grilled Salmon with Truffle (₫150,000), Wagyu Beef Tenderloin (₫320,000), and Beluga Caviar Tasting (₫280,000). Would you like more details about any of these?',
        timestamp: '2025-01-15T10:00:05'
      }
    ]
  }
];