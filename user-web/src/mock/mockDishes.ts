export interface MockDish {
  id: string;
  name: string;
  description: string;
  price: number;
  category_id: string;
  category_name: string;
  media_urls: string[];
  prep_time: number;
  is_best_seller?: boolean;
  seasonal?: boolean;
  rating?: number;
  reviews_count?: number;
  ingredients?: string[];
  allergens?: string[];
  nutrition?: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
}

export const mockDishes: MockDish[] = [
  {
    id: "dish-1",
    name: "Cá Hồi Nướng",
    description:
      "Cá hồi tươi nướng với gia vị đặc biệt, kèm rau củ và khoai tây nghiền",
    price: 350000,
    category_id: "cat-main",
    category_name: "Món Chính",
    media_urls: ["/grilled-salmon-dish.jpg"],
    prep_time: 20,
    is_best_seller: true,
    seasonal: false,
    rating: 4.8,
    reviews_count: 124,
    ingredients: [
      "Cá hồi Na Uy tươi",
      "Muối biển Himalaya",
      "Tiêu đen",
      "Thảo mộc tươi",
      "Mật ong",
    ],
    allergens: ["Cá"],
    nutrition: {
      calories: 420,
      protein: 35,
      carbs: 12,
      fat: 24,
    },
  },
  {
    id: "dish-2",
    name: "Bò Beefsteak Úc",
    description:
      "Thịt bò Úc cao cấp nướng tại bàn, kèm khoai tây và sốt đặc biệt",
    price: 450000,
    category_id: "cat-main",
    category_name: "Món Chính",
    media_urls: ["/premium-beef-steak.jpg"],
    prep_time: 25,
    is_best_seller: true,
    seasonal: false,
    rating: 4.7,
    reviews_count: 156,
    ingredients: [
      "Thịt bò Úc Wagyu",
      "Khoai tây",
      "Rau củ nướng",
      "Sốt đặc biệt",
    ],
    allergens: [],
    nutrition: {
      calories: 580,
      protein: 48,
      carbs: 18,
      fat: 32,
    },
  },
  {
    id: "dish-3",
    name: "Salad Caesar",
    description:
      "Rau xà lách tươi với sốt Caesar tự làm, bánh mì nướng và phô mai",
    price: 120000,
    category_id: "cat-appetizer",
    category_name: "Khai Vị",
    media_urls: ["/caesar-salad.jpg"],
    prep_time: 10,
    is_best_seller: false,
    seasonal: false,
    rating: 4.5,
    reviews_count: 89,
    ingredients: [
      "Xà lách romaine",
      "Sốt Caesar",
      "Bánh mì nướng",
      "Phô mai parmesan",
    ],
    allergens: ["Gluten", "Sữa"],
  },
  {
    id: "dish-4",
    name: "Soup Gà Truyền Thống",
    description: "Súp gà nóng hổi với thịt gà, nấm và rau củ tươi",
    price: 150000,
    category_id: "cat-appetizer",
    category_name: "Khai Vị",
    media_urls: ["/chicken-soup.jpg"],
    prep_time: 15,
    is_best_seller: false,
    seasonal: true,
    rating: 4.6,
    reviews_count: 67,
    ingredients: ["Thịt gà", "Nấm", "Cà rốt", "Hành tây", "Rau mùi"],
    allergens: [],
  },
  {
    id: "dish-5",
    name: "Bánh Chocolate Fondant",
    description: "Bánh chocolate đậm đà với kem tươi và dâu tây tươi",
    price: 120000,
    category_id: "cat-dessert",
    category_name: "Tráng Miệng",
    media_urls: ["/chocolate-cake-dessert.jpg"],
    prep_time: 12,
    is_best_seller: false,
    seasonal: true,
    rating: 4.9,
    reviews_count: 89,
    ingredients: ["Chocolate đen", "Kem tươi", "Dâu tây", "Đường", "Trứng"],
    allergens: ["Trứng", "Sữa"],
  },
  {
    id: "dish-6",
    name: "Tôm Hùm Nướng",
    description: "Tôm hùm tươi sống nướng với bơ tỏi, kèm rau củ nướng",
    price: 680000,
    category_id: "cat-main",
    category_name: "Món Chính",
    media_urls: ["/grilled-lobster.jpg"],
    prep_time: 30,
    is_best_seller: false,
    seasonal: false,
    rating: 4.8,
    reviews_count: 45,
    ingredients: ["Tôm hùm tươi", "Bơ", "Tỏi", "Rau củ"],
    allergens: ["Hải sản"],
  },
];

export const getDishById = (id: string): MockDish | undefined => {
  return mockDishes.find((dish) => dish.id === id);
};

export const getDishesByCategory = (categoryId: string): MockDish[] => {
  if (categoryId === "all") return mockDishes;
  return mockDishes.filter((dish) => dish.category_id === categoryId);
};
