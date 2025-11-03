"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Search,
  Star,
  Clock,
  Sparkles,
  Eye,
  Plus,
  X,
  ChevronRight,
  Filter,
} from "lucide-react";
import Image from "next/image";
import { mockDishes, MockDish } from "@/mock/mockDishes";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

interface DishSelectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectDish: (dish: MockDish) => void;
  selectedDishIds?: string[];
  title?: string;
  description?: string;
}

const categories = [
  { id: "all", name: "Tất cả", icon: "🍽️" },
  { id: "cat-main", name: "Món Chính", icon: "🍽️" },
  { id: "cat-appetizer", name: "Khai Vị", icon: "🥗" },
  { id: "cat-dessert", name: "Tráng Miệng", icon: "🍰" },
  { id: "cat-drink", name: "Đồ Uống", icon: "🍷" },
  { id: "cat-vegetarian", name: "Món Chay", icon: "🥬" },
];

export default function DishSelectionDialog({
  open,
  onOpenChange,
  onSelectDish,
  selectedDishIds = [],
  title = "Chọn Món",
  description = "Chọn món bạn muốn thêm",
}: DishSelectionDialogProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedDishDetail, setSelectedDishDetail] = useState<MockDish | null>(
    null
  );
  const [sortBy, setSortBy] = useState<"name" | "price" | "rating">("name");

  // Get unique categories from dishes
  const availableCategories = useMemo(() => {
    const categoryMap = new Map<string, { name: string; icon: string }>();
    mockDishes.forEach((dish) => {
      if (!categoryMap.has(dish.category_id)) {
        const cat = categories.find((c) => c.id === dish.category_id);
        if (cat) {
          categoryMap.set(dish.category_id, {
            name: dish.category_name || cat.name,
            icon: cat.icon,
          });
        }
      }
    });
    return Array.from(categoryMap.entries()).map(([id, data]) => ({
      id,
      ...data,
    }));
  }, []);

  const filteredDishes = useMemo(() => {
    let filtered = mockDishes.filter((dish) => {
      // Category filter
      if (selectedCategory !== "all" && dish.category_id !== selectedCategory) {
        return false;
      }

      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        if (
          !dish.name.toLowerCase().includes(query) &&
          !dish.description.toLowerCase().includes(query)
        ) {
          return false;
        }
      }

      return true;
    });

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "price":
          return a.price - b.price;
        case "rating":
          return (b.rating || 0) - (a.rating || 0);
        default:
          return a.name.localeCompare(b.name);
      }
    });

    return filtered;
  }, [selectedCategory, searchQuery, sortBy]);

  const handleDishClick = (dish: MockDish) => {
    setSelectedDishDetail(dish);
  };

  const handleAddFromDetail = (dish: MockDish) => {
    onSelectDish(dish);
    setSelectedDishDetail(null);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-6xl max-h-[90vh] p-0 overflow-hidden flex flex-col">
          <DialogHeader className="px-6 pt-6 pb-4 border-b">
            <DialogTitle className="font-elegant text-2xl">{title}</DialogTitle>
            <DialogDescription>{description}</DialogDescription>
          </DialogHeader>

          {/* Filters and Search */}
          <div className="px-6 py-4 border-b space-y-4 bg-muted/30">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Tìm kiếm món ăn..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 border-accent/20 focus:border-accent"
              />
            </div>

            {/* Category Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2">
              <Button
                variant={selectedCategory === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory("all")}
                className={cn(
                  selectedCategory === "all" &&
                    "bg-gradient-gold text-primary-foreground hover:opacity-90",
                  "border-accent/20 whitespace-nowrap"
                )}
              >
                Tất cả
              </Button>
              {availableCategories.map((cat) => (
                <Button
                  key={cat.id}
                  variant={selectedCategory === cat.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(cat.id)}
                  className={cn(
                    selectedCategory === cat.id &&
                      "bg-gradient-gold text-primary-foreground hover:opacity-90",
                    "border-accent/20 whitespace-nowrap"
                  )}
                >
                  <span className="mr-1">{cat.icon}</span>
                  {cat.name}
                </Button>
              ))}
            </div>

            {/* Sort */}
            <div className="flex items-center gap-2 text-sm">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Sắp xếp:</span>
              <div className="flex gap-2">
                {(["name", "price", "rating"] as const).map((sort) => (
                  <Button
                    key={sort}
                    variant={sortBy === sort ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setSortBy(sort)}
                    className={cn(
                      sortBy === sort &&
                        "bg-gradient-gold text-primary-foreground hover:opacity-90",
                      "h-7 text-xs"
                    )}
                  >
                    {sort === "name" && "Tên"}
                    {sort === "price" && "Giá"}
                    {sort === "rating" && "Đánh giá"}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          {/* Dishes List */}
          <div className="flex-1 overflow-y-auto px-6 py-4">
            {filteredDishes.length > 0 ? (
              <div className="space-y-3">
                <AnimatePresence>
                  {filteredDishes.map((dish, index) => {
                    const isSelected = selectedDishIds.includes(dish.id);

                    return (
                      <motion.div
                        key={dish.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ delay: index * 0.02 }}
                        whileHover={{ scale: 1.01, x: 4 }}
                      >
                        <Card
                          className={cn(
                            "cursor-pointer border-2 transition-all hover:shadow-lg",
                            isSelected
                              ? "border-accent ring-2 ring-accent/20 bg-accent/5"
                              : "border-border hover:border-accent/50"
                          )}
                          onClick={() => handleDishClick(dish)}
                        >
                          <CardContent className="p-4">
                            <div className="flex gap-4">
                              {/* Dish Image */}
                              <div className="relative w-32 h-32 rounded-lg overflow-hidden flex-shrink-0">
                                <Image
                                  src={dish.media_urls[0] || "/placeholder.svg"}
                                  alt={dish.name}
                                  fill
                                  className="object-cover"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 hover:opacity-100 transition-opacity" />
                                {dish.is_best_seller && (
                                  <Badge className="absolute top-2 left-2 bg-gradient-gold text-primary-foreground border-0 text-xs">
                                    <Star className="w-3 h-3 mr-1 fill-current" />
                                    Bán Chạy
                                  </Badge>
                                )}
                              </div>

                              {/* Dish Info */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between mb-2">
                                  <div className="flex-1 min-w-0">
                                    <h3 className="font-bold text-lg text-primary mb-1 line-clamp-1">
                                      {dish.name}
                                    </h3>
                                    <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                                      {dish.description}
                                    </p>
                                  </div>
                                  <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0 ml-2" />
                                </div>

                                <div className="flex items-center gap-4 flex-wrap">
                                  {/* Rating */}
                                  {dish.rating && (
                                    <div className="flex items-center gap-1">
                                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                                      <span className="text-sm font-semibold">
                                        {dish.rating.toFixed(1)}
                                      </span>
                                      {dish.reviews_count && (
                                        <span className="text-xs text-muted-foreground">
                                          ({dish.reviews_count})
                                        </span>
                                      )}
                                    </div>
                                  )}

                                  {/* Prep Time */}
                                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                    <Clock className="h-4 w-4" />
                                    <span>{dish.prep_time} phút</span>
                                  </div>

                                  {/* Category */}
                                  <Badge
                                    variant="outline"
                                    className="text-xs border-accent/20"
                                  >
                                    {dish.category_name}
                                  </Badge>

                                  {/* Seasonal */}
                                  {dish.seasonal && (
                                    <Badge className="bg-green-500/90 text-white border-0 text-xs">
                                      <Sparkles className="w-3 h-3 mr-1" />
                                      Theo Mùa
                                    </Badge>
                                  )}
                                </div>

                                {/* Price and Add Button */}
                                <div className="flex items-center justify-between mt-3">
                                  <div>
                                    <p className="text-xs text-muted-foreground mb-1">
                                      Giá
                                    </p>
                                    <p className="font-bold text-xl text-accent">
                                      {dish.price.toLocaleString("vi-VN")}đ
                                    </p>
                                  </div>
                                  <Button
                                    className={cn(
                                      "bg-gradient-gold text-primary-foreground hover:opacity-90",
                                      isSelected &&
                                        "opacity-50 cursor-not-allowed"
                                    )}
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onSelectDish(dish);
                                    }}
                                    disabled={isSelected}
                                  >
                                    {isSelected ? (
                                      <>
                                        <X className="h-4 w-4 mr-2" />
                                        Đã chọn
                                      </>
                                    ) : (
                                      <>
                                        <Plus className="h-4 w-4 mr-2" />
                                        Thêm
                                      </>
                                    )}
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            ) : (
              <div className="text-center py-12">
                <Search className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                <p className="text-muted-foreground text-lg">
                  Không tìm thấy món ăn
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm
                </p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Dish Detail Sheet */}
      <Sheet
        open={!!selectedDishDetail}
        onOpenChange={(open) => !open && setSelectedDishDetail(null)}
      >
        <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
          {selectedDishDetail && (
            <div className="h-full flex flex-col p-3">
              <SheetHeader className="flex-shrink-0 pb-4 border-b">
                <SheetTitle className="font-elegant text-2xl">
                  {selectedDishDetail.name}
                </SheetTitle>
                <SheetDescription>
                  {selectedDishDetail.description}
                </SheetDescription>
              </SheetHeader>

              <div className="mt-6 space-y-6 flex-1 overflow-y-auto pb-4">
                {/* Image */}
                <div className="relative aspect-video rounded-lg overflow-hidden border-2 border-accent/20">
                  <Image
                    src={selectedDishDetail.media_urls[0] || "/placeholder.svg"}
                    alt={selectedDishDetail.name}
                    fill
                    className="object-cover"
                  />
                  <div className="absolute top-4 left-4 flex gap-2">
                    {selectedDishDetail.is_best_seller && (
                      <Badge className="bg-gradient-gold text-primary-foreground border-0">
                        <Star className="w-3 h-3 mr-1 fill-current" />
                        Bán Chạy
                      </Badge>
                    )}
                    {selectedDishDetail.seasonal && (
                      <Badge className="bg-green-500/90 text-white border-0">
                        <Sparkles className="w-3 h-3 mr-1" />
                        Theo Mùa
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Info Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Giá</p>
                    <p className="font-bold text-xl text-accent">
                      {selectedDishDetail.price.toLocaleString("vi-VN")}đ
                    </p>
                  </div>
                  {selectedDishDetail.rating && (
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Đánh giá</p>
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span className="font-semibold">
                          {selectedDishDetail.rating.toFixed(1)}
                        </span>
                        {selectedDishDetail.reviews_count && (
                          <span className="text-xs text-muted-foreground">
                            ({selectedDishDetail.reviews_count})
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Thời gian</p>
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="font-semibold">
                        {selectedDishDetail.prep_time} phút
                      </span>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Danh mục</p>
                    <Badge variant="outline" className="border-accent/20">
                      {selectedDishDetail.category_name}
                    </Badge>
                  </div>
                </div>

                {/* Ingredients */}
                {selectedDishDetail.ingredients &&
                  selectedDishDetail.ingredients.length > 0 && (
                    <div>
                      <h4 className="font-semibold mb-2">Nguyên liệu</h4>
                      <div className="flex flex-wrap gap-2">
                        {selectedDishDetail.ingredients.map((ing, idx) => (
                          <Badge
                            key={idx}
                            variant="outline"
                            className="border-accent/20"
                          >
                            {ing}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                {/* Allergens */}
                {selectedDishDetail.allergens &&
                  selectedDishDetail.allergens.length > 0 && (
                    <div>
                      <h4 className="font-semibold mb-2 text-amber-600">
                        Dị ứng
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {selectedDishDetail.allergens.map((allergen, idx) => (
                          <Badge
                            key={idx}
                            variant="outline"
                            className="border-amber-500/50 text-amber-600"
                          >
                            {allergen}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                {/* Nutrition */}
                {selectedDishDetail.nutrition && (
                  <div>
                    <h4 className="font-semibold mb-2">Dinh dưỡng</h4>
                    <div className="grid grid-cols-4 gap-4">
                      <div className="text-center p-3 bg-muted/50 rounded-lg">
                        <p className="text-sm text-muted-foreground">
                          Calories
                        </p>
                        <p className="font-bold">
                          {selectedDishDetail.nutrition.calories}
                        </p>
                      </div>
                      <div className="text-center p-3 bg-muted/50 rounded-lg">
                        <p className="text-sm text-muted-foreground">Protein</p>
                        <p className="font-bold">
                          {selectedDishDetail.nutrition.protein}g
                        </p>
                      </div>
                      <div className="text-center p-3 bg-muted/50 rounded-lg">
                        <p className="text-sm text-muted-foreground">Carbs</p>
                        <p className="font-bold">
                          {selectedDishDetail.nutrition.carbs}g
                        </p>
                      </div>
                      <div className="text-center p-3 bg-muted/50 rounded-lg">
                        <p className="text-sm text-muted-foreground">Fat</p>
                        <p className="font-bold">
                          {selectedDishDetail.nutrition.fat}g
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* View Full Details Button */}
                <div className="flex gap-3 pt-4 border-t flex-shrink-0">
                  <Button
                    variant="outline"
                    className="flex-1 border-accent/20 hover:bg-accent/10"
                    onClick={() => {
                      router.push(`/dishes/${selectedDishDetail.id}`);
                      setSelectedDishDetail(null);
                      onOpenChange(false);
                    }}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Xem Chi Tiết & Đánh Giá
                  </Button>
                  <Button
                    className="flex-1 bg-gradient-gold text-primary-foreground hover:opacity-90"
                    onClick={() => handleAddFromDetail(selectedDishDetail)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Thêm Vào Đơn
                  </Button>
                </div>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}
