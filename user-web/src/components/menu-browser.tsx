"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
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
  ChefHat,
  Sparkles,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import OrderPlacement from "./order-placement";
import { useRouter } from "next/navigation";
import dishService from "@/services/dishService";
import userBehaviorService, {
  UserBehaviorLogAttributes,
} from "@/services/userBehaviorService";
import categoryService from "@/services/categoryService";
import { constructFromSymbol } from "date-fns/constants";
import { useAuth } from "@/lib/auth";

interface DishAttributes {
  id: string;
  name: string;
  description?: string;
  price: number;
  category_id: string;
  media_urls?: string[];
  is_best_seller: boolean;
  seasonal: boolean;
  active: boolean;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
}

interface CategoryAttributes {
  id: string;
  name: string;
  icon?: string;
}

interface CartItem {
  dish_id: string;
  quantity: number;
  customizations: Record<string, any>;
}

interface Filters {
  search?: string;
  category_id?: string;
  is_best_seller?: boolean;
  seasonal?: boolean;
  min_price?: number;
  max_price?: number | null;
}

/* Helper: format VND */
const formatVND = (amount: number): string => {
  return amount.toLocaleString("vi-VN") + "đ";
};

export default function MenuBrowser() {
  const router = useRouter();

  // State
  const [dishes, setDishes] = useState<DishAttributes[]>([]);
  const [categories, setCategories] = useState<CategoryAttributes[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalItems, setTotalItems] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 9;

  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<
    "recommended" | "price_asc" | "price_desc"
  >("recommended");

  const [filters, setFilters] = useState<Filters>({});
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showOrderPlacement, setShowOrderPlacement] = useState(false);
  const { user } = useAuth();

  // === TÍNH TOÁN PHÂN TRANG ===
  const totalPages = useMemo(() => {
    return Math.ceil(totalItems / itemsPerPage);
  }, [totalItems, itemsPerPage]);

  // Reset trang khi filter/sort thay đổi
  useEffect(() => {
    setCurrentPage(1);
  }, [filters, sortBy]);

  const addUserBehavior = async (userBehavior: UserBehaviorLogAttributes) => {
    //add behavior of usser when searching dish
    if (userBehavior) {
      await userBehaviorService.addBehavior(userBehavior);
    }
  };

  const handleClickDish = (dishId: string) => {
    router.push(`/dishes/${dishId}`);

    if (user) {
      
      addUserBehavior({
        user_id: user.id,
        item_id: dishId,
        action_type: "CLICK",
      });
    }
  };

  // Fetch dishes - ĐÃ SỬA HOÀN TOÀN ĐÚNG VỚI BACKEND
  const fetchDishes = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Tạo object params thông thường thay vì URLSearchParams
      const params: Record<string, string> = {};

      // SEARCH → backend dùng "name"
      if (filters.search?.trim()) {
        params.name = filters.search.trim();
      }

      // CATEGORY
      if (filters.category_id) {
        params.category_id = filters.category_id;
      }

      // BEST SELLER & SEASONAL
      if (filters.is_best_seller !== undefined) {
        params.is_best_seller = String(filters.is_best_seller);
      }
      if (filters.seasonal !== undefined) {
        params.seasonal = String(filters.seasonal);
      }

      // PRICE → dùng price_min / price_max
      if (filters.min_price !== undefined) {
        params.price_min = String(filters.min_price);
      }
      if (filters.max_price !== undefined && filters.max_price !== null) {
        params.price_max = String(filters.max_price);
      }

      // SORT → ĐÚNG THEO BACKEND
      switch (sortBy) {
        case "recommended":
          params.sort = "recommended"; // A-Z
          break;
        case "price_asc":
          params.sort = "price"; // Giá thấp → cao
          break;
        case "price_desc":
          params.sort = "-price"; // Giá cao → thấp
          break;
      }

      params.page = String(currentPage);
      params.limit = String(itemsPerPage);

      const res = await dishService.getAll(params);

      //add behavior of usser when searching dish
      if (filters.search && user) {
        await addUserBehavior({
          user_id: user.id,
          item_id: "",
          action_type: "SEARCH",
          search_query: filters.search,
        });
      }

      if (!res) throw new Error("Không thể tải món ăn");

      const { data: rawDishes, pagination } = res.data;
      const total = pagination?.total ?? 0;

      // Ép kiểu price → number
      const normalizedDishes = Array.isArray(rawDishes)
        ? rawDishes.map((dish: any) => ({
            ...dish,
            price: Number(dish.price) || 0,
          }))
        : [];

      setDishes(normalizedDishes);
      console.log("Fetched dishes:", normalizedDishes);
      setTotalItems(total);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Lỗi tải dữ liệu");
    } finally {
      setIsLoading(false);
    }
  }, [filters, sortBy, currentPage]);

  // Fetch categories
  const fetchCategories = useCallback(async () => {
    try {
      const res = await categoryService.getAll();
      if (res?.data?.data) {
        const data = res.data.data;
        setCategories(Array.isArray(data) ? data : data.categories || []);
      }
    } catch (err) {
      console.error("Lỗi tải danh mục:", err);
    }
  }, []);

  // Load data lần đầu
  useEffect(() => {
    fetchCategories();
    fetchDishes();
  }, [fetchCategories]);

  // Gọi lại khi filter/search/sort/page thay đổi
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchDishes();
    }, 300);
    return () => clearTimeout(timer);
  }, [filters, sortBy, currentPage, fetchDishes]);

  // Search handler
  const handleSearch = () => {
    setFilters((prev) => ({
      ...prev,
      search: searchQuery.trim() || undefined,
    }));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  // Handle category selection
  const handleCategorySelect = (id: string) => {
    setFilters((prev) => ({
      ...prev,
      category_id: id === "all" ? undefined : id,
    }));
  };

  // Pagination handlers
  const handlePrevPage = () => {
    if (currentPage > 1) setCurrentPage((prev) => prev - 1);
  };
  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage((prev) => prev + 1);
  };

  // Cart logic
  const addToCart = (
    dishId: string,
    customizations: Record<string, any> = {}
  ) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.dish_id === dishId);
      if (existing) {
        return prev.map((i) =>
          i.dish_id === dishId ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...prev, { dish_id: dishId, quantity: 1, customizations }];
    });
  };

  const updateQuantity = (dishId: string, qty: number) => {
    if (qty <= 0) {
      setCart((prev) => prev.filter((i) => i.dish_id !== dishId));
    } else {
      setCart((prev) =>
        prev.map((i) => (i.dish_id === dishId ? { ...i, quantity: qty } : i))
      );
    }
  };

  const getCartQuantity = (dishId: string) => {
    return cart.find((i) => i.dish_id === dishId)?.quantity || 0;
  };

  const getTotalItems = () => cart.reduce((sum, i) => sum + i.quantity, 0);

  const getTotalPrice = () =>
    cart.reduce((sum, i) => {
      const dish = dishes.find((d) => d.id === i.dish_id);
      const price = dish?.price ?? 0;
      return sum + price * i.quantity;
    }, 0);

  const proceedToOrder = () => {
    if (cart.length > 0) setShowOrderPlacement(true);
  };

  if (showOrderPlacement) {
    return <OrderPlacement />;
  }

  return (
    <div className="min-h-screen bg-gradient-cream py-8 px-4 sm:px-6 lg:px-8">
      {error ? (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-red-600 mb-2">Lỗi</h2>
            <p className="text-gray-600">{error}</p>
          </div>
        </div>
      ) : (
        <div className="max-w-7xl mx-auto">
          {isLoading ? (
            <div className="flex items-center justify-center min-h-[400px]">
              <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-accent"></div>
            </div>
          ) : (
            <>
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
                      Khám phá những món ăn tinh tế được chế biến từ nguyên liệu
                      cao cấp
                    </p>
                  </div>
                </div>

                {/* Search & Filters */}
                <div className="mb-8 space-y-6">
                  {/* Search Bar */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-primary">
                      Tìm kiếm món ăn
                    </label>
                    <div className="flex gap-3">
                      <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                        <Input
                          placeholder="Nhập tên món..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          onKeyPress={handleKeyPress}
                          className="pl-10 border-accent/20 focus:border-accent"
                        />
                      </div>
                      <Button
                        onClick={handleSearch}
                        className="bg-gradient-gold text-primary-foreground hover:opacity-90"
                      >
                        <Search className="w-4 h-4 mr-2" />
                        Tìm
                      </Button>
                    </div>
                  </div>

                  {/* Price Range Filter */}
                  <div className="space-y-3">
                    <label className="text-sm font-medium text-primary">
                      Khoảng giá
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                      {[
                        { label: "Dưới 100k", min: 0, max: 100000 },
                        { label: "100k - 300k", min: 100000, max: 300000 },
                        { label: "300k - 500k", min: 300000, max: 500000 },
                        { label: "Trên 500k", min: 500000, max: null },
                      ].map((range) => {
                        const isActive =
                          filters.min_price === range.min &&
                          filters.max_price === range.max;
                        return (
                          <Button
                            key={range.label}
                            variant={isActive ? "default" : "outline"}
                            size="sm"
                            onClick={() => {
                              setFilters((prev) => ({
                                ...prev,
                                min_price: range.min,
                                max_price: range.max,
                              }));
                            }}
                            className={
                              isActive
                                ? "bg-gradient-gold text-primary-foreground"
                                : "border-accent/20 hover:border-accent"
                            }
                          >
                            {range.label}
                          </Button>
                        );
                      })}
                      <Button
                        variant={
                          filters.min_price === undefined &&
                          filters.max_price === undefined
                            ? "default"
                            : "outline"
                        }
                        size="sm"
                        onClick={() => {
                          setFilters((prev) => ({
                            ...prev,
                            min_price: undefined,
                            max_price: undefined,
                          }));
                        }}
                        className={
                          filters.min_price === undefined &&
                          filters.max_price === undefined
                            ? "bg-gradient-gold text-primary-foreground"
                            : "border-accent/20"
                        }
                      >
                        Tất cả
                      </Button>
                    </div>
                  </div>

                  {/* HÀNG: Sắp xếp + Bán chạy + Theo mùa */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Sắp xếp theo */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-primary">
                        Sắp xếp theo
                      </label>
                      <Select
                        value={sortBy}
                        onValueChange={(
                          value: "recommended" | "price_asc" | "price_desc"
                        ) => {
                          setSortBy(value);
                        }}
                      >
                        <SelectTrigger className="border-accent/20">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="recommended">
                            Được đề xuất
                          </SelectItem>
                          <SelectItem value="price_asc">
                            Giá: Thấp → Cao
                          </SelectItem>
                          <SelectItem value="price_desc">
                            Giá: Cao → Thấp
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Bán chạy */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-primary flex items-center gap-1">
                        <Star className="w-4 h-4 text-yellow-500" />
                        Bán chạy
                      </label>
                      <Select
                        value={
                          filters.is_best_seller === undefined
                            ? "all"
                            : filters.is_best_seller
                            ? "true"
                            : "false"
                        }
                        onValueChange={(val: "all" | "true" | "false") => {
                          setFilters((prev) => ({
                            ...prev,
                            is_best_seller:
                              val === "all" ? undefined : val === "true",
                          }));
                        }}
                      >
                        <SelectTrigger className="border-accent/20">
                          <SelectValue placeholder="Chọn..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Tất cả</SelectItem>
                          <SelectItem value="true">Món bán chạy</SelectItem>
                          <SelectItem value="false">Món thường</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Theo mùa */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-primary flex items-center gap-1">
                        <Sparkles className="w-4 h-4 text-green-500" />
                        Món theo mùa
                      </label>
                      <Select
                        value={
                          filters.seasonal === undefined
                            ? "all"
                            : filters.seasonal
                            ? "true"
                            : "false"
                        }
                        onValueChange={(val: "all" | "true" | "false") => {
                          setFilters((prev) => ({
                            ...prev,
                            seasonal:
                              val === "all" ? undefined : val === "true",
                          }));
                        }}
                      >
                        <SelectTrigger className="border-accent/20">
                          <SelectValue placeholder="Chọn..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Tất cả</SelectItem>
                          <SelectItem value="true">Món theo mùa</SelectItem>
                          <SelectItem value="false">
                            Món không theo mùa
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Category Pills */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-primary">
                      Danh mục món ăn
                    </label>
                    <div className="flex flex-wrap gap-2">
                      <motion.div
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <Button
                          variant={
                            filters.category_id === undefined
                              ? "default"
                              : "outline"
                          }
                          size="sm"
                          onClick={() => handleCategorySelect("all")}
                          className={
                            filters.category_id === undefined
                              ? "bg-gradient-gold text-primary-foreground"
                              : "border-accent/20 hover:border-accent"
                          }
                        >
                          Tất cả
                        </Button>
                      </motion.div>
                      {categories.map((category) => {
                        const isSelected = filters.category_id === category.id;
                        return (
                          <motion.div
                            key={category.id}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            <Button
                              variant={isSelected ? "default" : "outline"}
                              size="sm"
                              onClick={() => handleCategorySelect(category.id)}
                              className={
                                isSelected
                                  ? "bg-gradient-gold text-primary-foreground"
                                  : "border-accent/20 hover:border-accent"
                              }
                            >
                              <span className="mr-2">
                                {category.icon || ""}
                              </span>
                              {category.name}
                            </Button>
                          </motion.div>
                        );
                      })}
                    </div>
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
                            {formatVND(getTotalPrice())}
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
                {dishes.map((dish, index) => {
                  const category = categories.find(
                    (c) => c.id === dish.category_id
                  );
                  const cartQuantity = getCartQuantity(dish.id);

                  return (
                    <motion.div
                      key={dish.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: index * 0.1 }}
                      whileHover={{ y: -4 }}
                    >
                      <Card className="group overflow-hidden border-2 border-transparent hover:border-accent/30 transition-all duration-300 shadow-md hover:shadow-xl bg-card h-full flex flex-col">
                        <div className="relative aspect-[4/3] overflow-hidden">
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent z-10" />
                          <img
                            src={dish.media_urls?.[0] || "/placeholder.svg"}
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
                        </div>

                        <CardHeader className="flex-1">
                          <CardTitle className="font-elegant text-xl text-primary group-hover:text-accent transition-colors">
                            {dish.name}
                          </CardTitle>
                          <CardDescription className="font-serif text-sm leading-relaxed line-clamp-2">
                            {dish.description ||
                              "Món ăn tinh tế từ nguyên liệu cao cấp"}
                          </CardDescription>
                        </CardHeader>

                        <CardContent className="space-y-4">
                          <div className="flex justify-between items-center">
                            <span className="text-2xl font-bold text-accent">
                              {formatVND(dish.price)}
                            </span>
                            <motion.div
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                            >
                              <Button
                                variant="outline"
                                size="sm"
                                className="border-accent/20 hover:bg-accent/10"
                                onClick={() => {
                                  handleClickDish(dish.id);
                                }}
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

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-4 mt-8">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage === 1}
                    onClick={handlePrevPage}
                  >
                    <ChevronLeft className="w-4 h-4 mr-2" />
                    Trước
                  </Button>
                  <span className="text-muted-foreground font-medium">
                    Trang {currentPage} / {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage === totalPages}
                    onClick={handleNextPage}
                  >
                    Sau
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              )}

              {dishes.length === 0 && !isLoading && (
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
            </>
          )}
        </div>
      )}
    </div>
  );
}
