// Menu API
export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image: string;
  available: boolean;
  ingredients: string[];
  allergens: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface MenuCategory {
  id: string;
  name: string;
  description: string;
  order: number;
}

export interface CreateMenuItemRequest {
  name: string;
  description: string;
  price: number;
  categoryId: string;
  image?: string;
  ingredients: string[];
  allergens: string[];
}

export interface UpdateMenuItemRequest extends Partial<CreateMenuItemRequest> {
  available?: boolean;
}

// Mock data
const mockMenuItems: MenuItem[] = [
  {
    id: '1',
    name: 'Phở Bò Tái',
    description: 'Phở bò truyền thống với thịt bò tái',
    price: 65000,
    category: 'Món chính',
    image: 'https://example.com/pho-bo-tai.jpg',
    available: true,
    ingredients: ['Bánh phở', 'Thịt bò', 'Hành tây', 'Ngò gai'],
    allergens: ['Gluten'],
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  {
    id: '2',
    name: 'Gỏi Cuốn Tôm',
    description: 'Gỏi cuốn tươi với tôm và rau sống',
    price: 45000,
    category: 'Khai vị',
    image: 'https://example.com/goi-cuon-tom.jpg',
    available: true,
    ingredients: ['Bánh tráng', 'Tôm', 'Rau sống', 'Bún'],
    allergens: ['Tôm'],
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
];

const mockCategories: MenuCategory[] = [
  { id: '1', name: 'Khai vị', description: 'Món khai vị', order: 1 },
  { id: '2', name: 'Món chính', description: 'Món ăn chính', order: 2 },
  { id: '3', name: 'Tráng miệng', description: 'Món tráng miệng', order: 3 },
  { id: '4', name: 'Thức uống', description: 'Đồ uống', order: 4 },
];

// API functions
export const getMenuItems = async (): Promise<MenuItem[]> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  return mockMenuItems;
};

export const getMenuCategories = async (): Promise<MenuCategory[]> => {
  await new Promise(resolve => setTimeout(resolve, 500));
  return mockCategories;
};

export const getMenuItemById = async (id: string): Promise<MenuItem | null> => {
  await new Promise(resolve => setTimeout(resolve, 500));
  return mockMenuItems.find(item => item.id === id) || null;
};

export const createMenuItem = async (data: CreateMenuItemRequest): Promise<MenuItem> => {
  await new Promise(resolve => setTimeout(resolve, 1000));
  const category = mockCategories.find(cat => cat.id === data.categoryId);
  const newItem: MenuItem = {
    id: Date.now().toString(),
    name: data.name,
    description: data.description,
    price: data.price,
    category: category?.name || 'Khác',
    image: data.image || '',
    available: true,
    ingredients: data.ingredients,
    allergens: data.allergens,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  mockMenuItems.push(newItem);
  return newItem;
};

export const updateMenuItem = async (id: string, data: UpdateMenuItemRequest): Promise<MenuItem> => {
  await new Promise(resolve => setTimeout(resolve, 1000));
  const index = mockMenuItems.findIndex(item => item.id === id);
  if (index === -1) {
    throw new Error('Menu item not found');
  }
  
  mockMenuItems[index] = {
    ...mockMenuItems[index],
    ...data,
    updatedAt: new Date(),
  };
  
  return mockMenuItems[index];
};

export const deleteMenuItem = async (id: string): Promise<void> => {
  await new Promise(resolve => setTimeout(resolve, 1000));
  const index = mockMenuItems.findIndex(item => item.id === id);
  if (index === -1) {
    throw new Error('Menu item not found');
  }
  mockMenuItems.splice(index, 1);
};