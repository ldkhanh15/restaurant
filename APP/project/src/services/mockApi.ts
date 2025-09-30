import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  mockUsers, mockDishes, mockCategories, mockTables, mockReservations,
  mockOrders, mockVouchers, mockReviews, mockBlogPosts, mockNotifications,
  mockChatSessions, User, Dish, Category, Table, Reservation, Order,
  Voucher, Review, BlogPost, Notification, ChatSession, ChatMessage
} from '../data/mockData';

const CACHE_KEYS = {
  USERS: 'users',
  DISHES: 'dishes',
  CATEGORIES: 'categories',
  TABLES: 'tables',
  RESERVATIONS: 'reservations',
  ORDERS: 'orders',
  VOUCHERS: 'vouchers',
  REVIEWS: 'reviews',
  BLOG_POSTS: 'blog_posts',
  NOTIFICATIONS: 'notifications',
  CHAT_SESSIONS: 'chat_sessions',
};

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Demo users for different roles
const demoUsers: User[] = [
  {
    id: 'demo-customer-1',
    username: 'john_doe',
    email: 'customer@demo.com',
    phone: '+1234567890',
    role: 'customer',
    full_name: 'John Doe',
    preferences: {
      allergies: ['nuts'],
      favorite_dishes: ['dish-1', 'dish-3'],
      preferred_location: 'near_window',
      dietary_restrictions: ['vegetarian'],
      notification_preferences: {
        email: true,
        push: true,
        sms: false,
      },
    },
    ranking: 'vip',
    points: 500,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    is_active: true,
  },
  {
    id: 'demo-employee-1',
    username: 'jane_employee',
    email: 'employee@demo.com',
    phone: '+1234567891',
    role: 'employee',
    full_name: 'Jane Smith',
    preferences: {
      allergies: [],
      favorite_dishes: [],
      preferred_location: 'near_window',
      dietary_restrictions: [],
      notification_preferences: {
        email: true,
        push: true,
        sms: true,
      },
    },
    ranking: 'regular',
    points: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    is_active: true,
  },
  {
    id: 'demo-admin-1',
    username: 'admin_user',
    email: 'admin@demo.com',
    phone: '+1234567892',
    role: 'admin',
    full_name: 'Admin User',
    preferences: {
      allergies: [],
      favorite_dishes: [],
      preferred_location: 'near_window',
      dietary_restrictions: [],
      notification_preferences: {
        email: true,
        push: true,
        sms: true,
      },
    },
    ranking: 'platinum',
    points: 1000,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    is_active: true,
  },
];

export const mockApi = {
  // Users
  async loginUser(email: string, password: string, role?: string): Promise<User | null> {
    await delay(1000);
    
    // Check demo users first
    const demoUser = demoUsers.find(u => u.email === email);
    if (demoUser && password === 'password') {
      if (!role || demoUser.role === role) {
        await AsyncStorage.setItem('currentUser', JSON.stringify(demoUser));
        return demoUser;
      }
    }
    
    // Check regular users
    const user = mockUsers.find(u => u.email === email);
    if (user && password === 'password') {
      if (!role || user.role === role) {
        await AsyncStorage.setItem('currentUser', JSON.stringify(user));
        return user;
      }
    }
    
    return null;
  },

  async registerUser(userData: Partial<User>): Promise<User> {
    await delay(1000);
    const newUser: User = {
      id: user-,
      username: userData.username || '',
      email: userData.email || '',
      phone: userData.phone,
      role: userData.role || 'customer',
      full_name: userData.full_name || '',
      preferences: userData.preferences || {
        allergies: [],
        favorite_dishes: [],
        preferred_location: 'near_window',
        dietary_restrictions: [],
        notification_preferences: {
          email: true,
          push: true,
          sms: false,
        },
      },
      ranking: 'regular',
      points: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      is_active: true,
    };
    mockUsers.push(newUser);
    await AsyncStorage.setItem('currentUser', JSON.stringify(newUser));
    return newUser;
  },

  async getCurrentUser(): Promise<User | null> {
    const userStr = await AsyncStorage.getItem('currentUser');
    return userStr ? JSON.parse(userStr) : null;
  },

  async logout(): Promise<void> {
    await AsyncStorage.removeItem('currentUser');
  },

  // Admin functions
  async getAllUsers(): Promise<User[]> {
    await delay(500);
    return [...demoUsers, ...mockUsers];
  },

  async createUser(userData: Partial<User>): Promise<User> {
    await delay(800);
    const newUser: User = {
      id: user-,
      username: userData.username || '',
      email: userData.email || '',
      phone: userData.phone,
      role: userData.role || 'customer',
      full_name: userData.full_name || '',
      preferences: userData.preferences || {
        allergies: [],
        favorite_dishes: [],
        preferred_location: 'near_window',
        dietary_restrictions: [],
        notification_preferences: {
          email: true,
          push: true,
          sms: false,
        },
      },
      ranking: userData.ranking || 'regular',
      points: userData.points || 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      is_active: userData.is_active !== undefined ? userData.is_active : true,
    };
    mockUsers.push(newUser);
    return newUser;
  },

  async updateUser(userId: string, userData: Partial<User>): Promise<User | null> {
    await delay(600);
    const userIndex = mockUsers.findIndex(u => u.id === userId);
    if (userIndex !== -1) {
      mockUsers[userIndex] = {
        ...mockUsers[userIndex],
        ...userData,
        updated_at: new Date().toISOString(),
      };
      return mockUsers[userIndex];
    }
    return null;
  },

  async deleteUser(userId: string): Promise<boolean> {
    await delay(500);
    const userIndex = mockUsers.findIndex(u => u.id === userId);
    if (userIndex !== -1) {
      mockUsers.splice(userIndex, 1);
      return true;
    }
    return false;
  },

  // Dishes
  async getDishes(): Promise<Dish[]> {
    await delay(500);
    let dishes = await AsyncStorage.getItem(CACHE_KEYS.DISHES);
    if (!dishes) {
      await AsyncStorage.setItem(CACHE_KEYS.DISHES, JSON.stringify(mockDishes));
      return mockDishes;
    }
    return JSON.parse(dishes);
  },

  async getDishesByCategory(categoryId: string): Promise<Dish[]> {
    const dishes = await this.getDishes();
    return dishes.filter(dish => dish.category_id === categoryId && dish.active);
  },

  async searchDishes(query: string): Promise<Dish[]> {
    const dishes = await this.getDishes();
    return dishes.filter(dish => 
      dish.active && (
        dish.name.toLowerCase().includes(query.toLowerCase()) ||
        dish.description.toLowerCase().includes(query.toLowerCase())
      )
    );
  },

  // Categories
  async getCategories(): Promise<Category[]> {
    await delay(300);
    return mockCategories;
  },

  // Tables
  async getTables(): Promise<Table[]> {
    await delay(400);
    return mockTables;
  },

  async getAvailableTables(date: string, numPeople: number): Promise<Table[]> {
    await delay(600);
    return mockTables.filter(table => 
      table.status === 'available' && table.capacity >= numPeople
    );
  },

  // Reservations
  async createReservation(reservationData: Omit<Reservation, 'id'>): Promise<Reservation> {
    await delay(800);
    const newReservation: Reservation = {
      ...reservationData,
      id: es-,
      status: 'pending'
    };
    mockReservations.push(newReservation);
    return newReservation;
  },

  async getUserReservations(userId: string): Promise<Reservation[]> {
    await delay(500);
    return mockReservations.filter(res => res.user_id === userId);
  },

  // Orders
  async createOrder(orderData: Omit<Order, 'id' | 'created_at'>): Promise<Order> {
    await delay(1000);
    const newOrder: Order = {
      ...orderData,
      id: order-,
      created_at: new Date().toISOString(),
    };
    mockOrders.push(newOrder);
    return newOrder;
  },

  async getUserOrders(userId: string): Promise<Order[]> {
    await delay(500);
    return mockOrders.filter(order => order.user_id === userId);
  },

  async getAllOrders(): Promise<Order[]> {
    await delay(500);
    return mockOrders;
  },

  async updateOrderStatus(orderId: string, status: Order['status']): Promise<Order | null> {
    await delay(600);
    const order = mockOrders.find(o => o.id === orderId);
    if (order) {
      order.status = status;
      return order;
    }
    return null;
  },

  // Vouchers
  async getVouchers(): Promise<Voucher[]> {
    await delay(300);
    return mockVouchers.filter(voucher => voucher.active);
  },

  async validateVoucher(code: string): Promise<Voucher | null> {
    await delay(500);
    const voucher = mockVouchers.find(v => v.code === code && v.active);
    if (voucher && new Date(voucher.expiry_date) > new Date()) {
      return voucher;
    }
    return null;
  },

  // Reviews
  async getReviews(): Promise<Review[]> {
    await delay(400);
    return mockReviews;
  },

  async createReview(reviewData: Omit<Review, 'id' | 'created_at'>): Promise<Review> {
    await delay(600);
    const newReview: Review = {
      ...reviewData,
      id: eview-,
      created_at: new Date().toISOString(),
    };
    mockReviews.push(newReview);
    return newReview;
  },

  // Blog
  async getBlogPosts(): Promise<BlogPost[]> {
    await delay(500);
    return mockBlogPosts.filter(post => post.status === 'published');
  },

  // Notifications
  async getUserNotifications(userId: string): Promise<Notification[]> {
    await delay(400);
    return mockNotifications.filter(notif => notif.user_id === userId);
  },

  // Chat
  async getChatSession(userId: string): Promise<ChatSession | null> {
    await delay(300);
    return mockChatSessions.find(session => session.user_id === userId) || null;
  },

  async sendChatMessage(userId: string, message: string): Promise<ChatMessage> {
    await delay(800);
    const botResponse = this.generateBotResponse(message);
    
    let session = mockChatSessions.find(s => s.user_id === userId);
    if (!session) {
      session = {
        id: chat-,
        user_id: userId,
        messages: []
      };
      mockChatSessions.push(session);
    }

    const userMessage: ChatMessage = {
      sender_type: 'user',
      message_text: message,
      timestamp: new Date().toISOString()
    };

    const botMessage: ChatMessage = {
      sender_type: 'bot',
      message_text: botResponse,
      timestamp: new Date().toISOString()
    };

    session.messages.push(userMessage, botMessage);
    return botMessage;
  },

  generateBotResponse(message: string): string {
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('menu') || lowerMessage.includes('dish')) {
      return "Here are our signature dishes: Grilled Salmon with Truffle (₫150,000), Wagyu Beef Tenderloin (₫320,000), and Beluga Caviar Tasting (₫280,000). Would you like more details about any of these?";
    }
    
    if (lowerMessage.includes('reservation') || lowerMessage.includes('book')) {
      return "I'd be happy to help with your reservation! Please use our reservation system to select your preferred date, time, and table. Is there anything specific you'd like me to know about your dining preferences?";
    }
    
    if (lowerMessage.includes('price') || lowerMessage.includes('cost')) {
      return "Our dishes range from ₫85,000 for desserts to ₫450,000 for premium beverages. Each dish is crafted with the finest ingredients for an exceptional dining experience.";
    }

    if (lowerMessage.includes('hello') || lowerMessage.includes('hi')) {
      return "Welcome to our luxury restaurant! I'm here to help you with any questions about our menu, reservations, or dining experience. How may I assist you today?";
    }
    
    return "Thank you for your message. Our team is here to ensure you have an exceptional dining experience. Is there anything specific I can help you with regarding our menu or services?";
  }
};
