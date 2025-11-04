"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Star,
  ShoppingCart,
  Search,
  Plus,
  Minus,
  Eye,
  Clock,
  ChefHat,
  Sparkles,
} from "lucide-react";
import OrderPlacement from "./order-placement";
import { useRouter } from "next/navigation";

const categories = [
  {
    id: "cat-1",
    name: "Khai Vị",
    description: "Món khai vị tinh tế",
    icon: "🥗",
  },
  {
    id: "cat-2",
    name: "Món Chính",
    description: "Các món chính đặc sắc",
    icon: "🍽️",
  },
  {
    id: "cat-3",
    name: "Tráng Miệng",
    description: "Món tráng miệng ngọt ngào",
    icon: "🍰",
  },
  {
    id: "cat-4",
    name: "Đồ Uống",
    description: "Thức uống cao cấp",
    icon: "🍷",
  },
  {
    id: "cat-5",
    name: "Món Chay",
    description: "Món chay thanh đạm",
    icon: "🥬",
  },
];

const dishes = [
  {
    id: "dish-1",
    name: "Cá Hồi Nướng",
    description:
      "Cá hồi tươi nướng với gia vị đặc biệt, kèm rau củ và khoai tây nghiền",
    price: 350000,
    media_urls: ["/grilled-salmon-dish.jpg"],
    is_best_seller: true,
    seasonal: false,
    category_id: "cat-2",
    prep_time: 25,
    ingredients: [
      "Cá hồi Na Uy",
      "Gia vị đặc biệt",
      "Rau củ tươi",
      "Khoai tây",
    ],
    allergens: ["Cá"],
    nutrition: { calories: 420, protein: 35, carbs: 15, fat: 25 },
    reviews: [
      {
        id: "r1",
        customer: "Nguyễn Thị Lan",
        rating: 5,
        comment: "Cá hồi tươi ngon, nướng vừa tới!",
        date: "2024-01-15",
      },
      {
        id: "r2",
        customer: "Trần Văn Nam",
        rating: 4,
        comment: "Món ăn ngon, trình bày đẹp",
        date: "2024-01-12",
      },
      {
        id: "r3",
        customer: "Lê Thị Hoa",
        rating: 5,
        comment: "Tuyệt vời! Sẽ quay lại",
        date: "2024-01-10",
      },
    ],
  },
  {
    id: "dish-2",
    name: "Bánh Chocolate",
    description:
      "Bánh chocolate đậm đà với kem tươi và dâu tây, trang trí tinh tế",
    price: 120000,
    media_urls: ["/chocolate-cake-dessert.jpg"],
    is_best_seller: false,
    seasonal: true,
    category_id: "cat-3",
    prep_time: 15,
    ingredients: ["Chocolate Bỉ", "Kem tươi", "Dâu tây", "Bột mì cao cấp"],
    allergens: ["Gluten", "Sữa", "Trứng"],
    nutrition: { calories: 380, protein: 8, carbs: 45, fat: 18 },
    reviews: [
      {
        id: "r4",
        customer: "Phạm Minh Tuấn",
        rating: 5,
        comment: "Bánh chocolate tuyệt vời!",
        date: "2024-01-14",
      },
      {
        id: "r5",
        customer: "Nguyễn Văn Đức",
        rating: 4,
        comment: "Ngọt vừa phải, rất ngon",
        date: "2024-01-11",
      },
    ],
  },
  {
    id: "dish-3",
    name: "Bò Beefsteak",
    description: "Thịt bò Úc cao cấp nướng tại bàn, kèm khoai tây và salad",
    price: 450000,
    media_urls: ["/premium-beef-steak.jpg"],
    is_best_seller: true,
    seasonal: false,
    category_id: "cat-2",
    prep_time: 30,
    ingredients: ["Thịt bò Úc", "Khoai tây", "Salad tươi", "Sốt đặc biệt"],
    allergens: [],
    nutrition: { calories: 520, protein: 45, carbs: 20, fat: 30 },
    reviews: [
      {
        id: "r6",
        customer: "Trần Thị Mai",
        rating: 5,
        comment: "Thịt bò tuyệt hảo, nướng hoàn hảo!",
        date: "2024-01-13",
      },
    ],
  },
  {
    id: "dish-4",
    name: "Salad Caesar",
    description: "Salad Caesar truyền thống với sốt đặc biệt và bánh mì nướng",
    price: 180000,
    media_urls: ["/caesar-salad.png"],
    is_best_seller: false,
    seasonal: false,
    category_id: "cat-1",
    prep_time: 10,
    ingredients: ["Rau cải rom", "Croutons", "Sốt Caesar", "Bánh mì nướng"],
    allergens: ["Gluten"],
    nutrition: { calories: 280, protein: 15, carbs: 25, fat: 10 },
    reviews: [
      {
        id: "r7",
        customer: "Hoàng Thị Hạnh",
        rating: 4,
        comment: "Salad rất ngon, sốt rất đặc biệt",
        date: "2024-01-09",
      },
      {
        id: "r8",
        customer: "Vũ Văn Minh",
        rating: 5,
        comment: "Tuyệt vời! Một món ăn không thể bỏ qua",
        date: "2024-01-08",
      },
    ],
  },
  {
    id: "dish-5",
    name: "Tôm Hùm Nướng",
    description: "Tôm hùm tươi nướng bơ tỏi, kèm cơm và rau củ",
    price: 680000,
    media_urls: ["/grilled-lobster.jpg"],
    is_best_seller: true,
    seasonal: false,
    category_id: "cat-2",
    prep_time: 40,
    ingredients: ["Tôm hùm tươi", "Bơ tỏi", "Cơm trắng", "Rau củ"],
    allergens: ["Tôm"],
    nutrition: { calories: 650, protein: 50, carbs: 10, fat: 40 },
    reviews: [
      {
        id: "r9",
        customer: "Lê Thị Mai",
        rating: 5,
        comment: "Tôm hùm tươi ngon, món ăn tuyệt vời!",
        date: "2024-01-17",
      },
    ],
  },
  {
    id: "dish-6",
    name: "Rượu Vang Đỏ",
    description: "Rượu vang đỏ Pháp cao cấp, hương vị đậm đà",
    price: 850000,
    media_urls: ["/red-wine-bottle.png"],
    is_best_seller: false,
    seasonal: false,
    category_id: "cat-4",
    prep_time: 5,
    ingredients: ["Rượu vang đỏ Pháp"],
    allergens: [],
    nutrition: { calories: 120, protein: 0, carbs: 0, fat: 0 },
    reviews: [
      {
        id: "r11",
        customer: "Nguyễn Thị Lan",
        rating: 5,
        comment: "Rượu vang đỏ tuyệt vời!",
        date: "2024-01-14",
      },
    ],
  },
  {
    id: "dish-7",
    name: "Tiramisu",
    description: "Tiramisu Ý truyền thống với cà phê espresso và mascarpone",
    price: 140000,
    media_urls: ["/classic-tiramisu.png"],
    is_best_seller: false,
    seasonal: false,
    category_id: "cat-3",
    prep_time: 30,
    ingredients: ["Bánh quy", "Cà phê espresso", "Mascarpone"],
    allergens: ["Gluten", "Sữa"],
    nutrition: { calories: 400, protein: 5, carbs: 50, fat: 20 },
    reviews: [
      {
        id: "r14",
        customer: "Phạm Minh Tuấn",
        rating: 4,
        comment: "Tiramisu ngon, trang trí đẹp mắt",
        date: "2024-01-11",
      },
    ],
  },
];

interface CartItem {
  dish_id: string;
  quantity: number;
  customizations: Record<string, any>;
}

export default function MenuBrowser() {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"name" | "price" | "popularity">("name");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showOrderPlacement, setShowOrderPlacement] = useState(false);

  const filteredAndSortedDishes = useMemo(() => {
    const filtered = dishes.filter((dish) => {
      const matchesCategory =
        selectedCategory === "all" || dish.category_id === selectedCategory;
      const matchesSearch =
        dish.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        dish.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });

    filtered.sort((a, b) => {
      switch (sortBy) {
        case "price":
          return a.price - b.price;
        case "popularity":
          return (b.is_best_seller ? 1 : 0) - (a.is_best_seller ? 1 : 0);
        default:
          return a.name.localeCompare(b.name);
      }
    });

    return filtered;
  }, [selectedCategory, searchQuery, sortBy]);

  const addToCart = (
    dishId: string,
    customizations: Record<string, any> = {}
  ) => {
    setCart((prev) => {
      const existingItem = prev.find((item) => item.dish_id === dishId);
      if (existingItem) {
        return prev.map((item) =>
          item.dish_id === dishId
            ? { ...item, quantity: item.quantity + 1, customizations }
            : item
        );
      }
      return [...prev, { dish_id: dishId, quantity: 1, customizations }];
    });
  };

  const updateQuantity = (dishId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      setCart((prev) => prev.filter((item) => item.dish_id !== dishId));
    } else {
      setCart((prev) =>
        prev.map((item) =>
          item.dish_id === dishId ? { ...item, quantity: newQuantity } : item
        )
      );
    }
  };

  const getCartQuantity = (dishId: string) => {
    const item = cart.find((item) => item.dish_id === dishId);
    return item ? item.quantity : 0;
  };

  const getTotalItems = () => {
    return cart.reduce((total, item) => total + item.quantity, 0);
  };

  const getTotalPrice = () => {
    return cart.reduce((total, item) => {
      const dish = dishes.find((d) => d.id === item.dish_id);
      return total + (dish ? dish.price * item.quantity : 0);
    }, 0);
  };

  const proceedToOrder = () => {
    if (cart.length > 0) {
      setShowOrderPlacement(true);
    }
  };

  if (showOrderPlacement) {
    return (
      <OrderPlacement
        initialCart={cart}
        onOrderComplete={() => setShowOrderPlacement(false)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-cream py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-12"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-gold rounded-full flex items-center justify-center shadow-lg">
              <ChefHat className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-elegant text-4xl md:text-5xl font-bold text-primary">
                Thực Đơn
              </h1>
              <p className="text-muted-foreground font-serif italic">
                Khám phá những món ăn tinh tế được chế biến từ nguyên liệu cao
                cấp
              </p>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="mb-8 space-y-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Tìm kiếm món ăn..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 border-accent/20 focus:border-accent"
                />
              </div>
              <Select
                value={sortBy}
                onValueChange={(value: any) => setSortBy(value)}
              >
                <SelectTrigger className="w-full md:w-48 border-accent/20 focus:border-accent">
                  <SelectValue placeholder="Sắp xếp theo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name">Tên món</SelectItem>
                  <SelectItem value="price">Giá cả</SelectItem>
                  <SelectItem value="popularity">Độ phổ biến</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Category Pills */}
            <div className="flex flex-wrap gap-2">
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  variant={selectedCategory === "all" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory("all")}
                  className={
                    selectedCategory === "all"
                      ? "bg-gradient-gold"
                      : "border-accent/20"
                  }
                >
                  Tất cả
                </Button>
              </motion.div>
              {categories.map((category) => (
                <motion.div
                  key={category.id}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button
                    variant={
                      selectedCategory === category.id ? "default" : "outline"
                    }
                    size="sm"
                    onClick={() => setSelectedCategory(category.id)}
                    className={
                      selectedCategory === category.id
                        ? "bg-gradient-gold"
                        : "border-accent/20"
                    }
                  >
                    <span className="mr-2">{category.icon}</span>
                    {category.name}
                  </Button>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Cart Summary */}
          <AnimatePresence>
            {cart.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="mb-8 p-4 bg-card border-2 border-accent/20 rounded-lg shadow-md"
              >
                <div className="flex justify-between items-center">
                  <div>
                    <span className="font-semibold text-primary">
                      Giỏ hàng: {getTotalItems()} món
                    </span>
                    <span className="ml-4 text-accent font-bold text-lg">
                      {getTotalPrice().toLocaleString("vi-VN")}đ
                    </span>
                  </div>
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Button
                      onClick={proceedToOrder}
                      className="bg-gradient-gold text-primary-foreground hover:opacity-90 shadow-md"
                    >
                      <ShoppingCart className="w-4 h-4 mr-2" />
                      Đặt Hàng
                    </Button>
                  </motion.div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Dishes Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAndSortedDishes.map((dish, index) => {
            const category = categories.find(
              (cat) => cat.id === dish.category_id
            );
            const cartQuantity = getCartQuantity(dish.id);
            const avgRating = dish.reviews
              ? dish.reviews.reduce((sum, r) => sum + r.rating, 0) /
                dish.reviews.length
              : 0;

            return (
              <motion.div
                key={dish.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                whileHover={{ y: -4 }}
              >
                <Card className="group overflow-hidden border-2 border-transparent hover:border-accent/30 transition-all duration-300 shadow-md hover:shadow-xl bg-card h-full flex flex-col">
                  {/* Image */}
                  <div className="relative aspect-[4/3] overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent z-10" />
                    <img
                      src={dish.media_urls[0] || "/placeholder.svg"}
                      alt={dish.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    <div className="absolute top-4 left-4 flex gap-2 z-20">
                      {dish.is_best_seller && (
                        <Badge className="bg-gradient-gold text-primary-foreground border-0 shadow-md">
                          <Star className="w-3 h-3 mr-1 fill-current" />
                          Bán Chạy
                        </Badge>
                      )}
                      {dish.seasonal && (
                        <Badge className="bg-green-500/90 text-white border-0 shadow-md">
                          <Sparkles className="w-3 h-3 mr-1" />
                          Theo Mùa
                        </Badge>
                      )}
                    </div>
                    <div className="absolute top-4 right-4 z-20">
                      <Badge className="bg-accent/20 text-accent border border-accent/30">
                        {category?.name}
                      </Badge>
                    </div>
                    <div className="absolute bottom-4 right-4 bg-background/90 backdrop-blur-sm rounded-lg px-3 py-1.5 z-20">
                      <div className="flex items-center gap-3 text-xs">
                        <div className="flex items-center gap-1">
                          <Star className="w-3 h-3 text-yellow-500 fill-current" />
                          <span className="font-medium">
                            {avgRating.toFixed(1)}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-muted-foreground" />
                          <span>{dish.prep_time}p</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <CardHeader className="flex-1">
                    <CardTitle className="font-elegant text-xl text-primary group-hover:text-accent transition-colors">
                      {dish.name}
                    </CardTitle>
                    <CardDescription className="font-serif text-sm leading-relaxed line-clamp-2">
                      {dish.description}
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-2xl font-bold text-accent">
                        {dish.price.toLocaleString("vi-VN")}đ
                      </span>
                      <motion.div
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                      >
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-accent/20 hover:bg-accent/10"
                          onClick={() => router.push(`/dishes/${dish.id}`)}
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          Chi Tiết
                        </Button>
                      </motion.div>
                    </div>

                    {cartQuantity > 0 ? (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <motion.div
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                          >
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-8 w-8 border-accent/20 hover:bg-accent/10"
                              onClick={() =>
                                updateQuantity(dish.id, cartQuantity - 1)
                              }
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                          </motion.div>
                          <span className="font-semibold min-w-[2rem] text-center">
                            {cartQuantity}
                          </span>
                          <motion.div
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                          >
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-8 w-8 border-accent/20 hover:bg-accent/10"
                              onClick={() =>
                                updateQuantity(dish.id, cartQuantity + 1)
                              }
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </motion.div>
                        </div>
                        <span className="text-sm text-muted-foreground">
                          Trong giỏ hàng
                        </span>
                      </div>
                    ) : (
                      <motion.div
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <Button
                          className="w-full bg-gradient-gold text-primary-foreground hover:opacity-90 shadow-md hover:shadow-lg transition-all duration-200"
                          onClick={() => addToCart(dish.id)}
                          size="lg"
                        >
                          <ShoppingCart className="w-4 h-4 mr-2" />
                          Thêm Vào Giỏ
                        </Button>
                      </motion.div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>

        {filteredAndSortedDishes.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16"
          >
            <ChefHat className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-muted-foreground font-serif text-lg">
              Không tìm thấy món ăn nào phù hợp với tiêu chí tìm kiếm
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
}
