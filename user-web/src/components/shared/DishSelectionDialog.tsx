"use client";

import { useState, useEffect, useCallback } from "react";
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
  Loader2,
} from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { dishService, type Dish } from "@/services/dishService";

// Minimal dish shape passed back to parent (compatible with existing handlers)
export type SelectableDish = {
  id: string;
  name: string;
  price: number;
  media_urls: string[];
  description?: string;
};

interface DishSelectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectDish: (dish: SelectableDish) => void;
  selectedDishIds?: string[];
  title?: string;
  description?: string;
}

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
  const [sortBy, setSortBy] = useState<"name" | "price">("name");
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [dishes, setDishes] = useState<Dish[]>([]);

  // Fetch dishes (first page)
  const loadDishes = useCallback(async () => {
    try {
      setIsLoading(true);
      setPage(1);
      const res = await dishService.search({
        page: 1,
        limit: 12,
        sortBy: sortBy === "price" ? "price" : "name",
        sortOrder: "ASC",
        name: searchQuery || undefined,
        active: true,
      });
      const data = res.data;
      setDishes(data.items || []);
      setTotalPages(data.totalPages || 1);
      setPage(data.currentPage || 1);
    } catch (e) {
      setDishes([]);
      setTotalPages(1);
      setPage(1);
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, sortBy]);

  // Load more (next page)
  const loadMore = useCallback(async () => {
    if (isLoadingMore || page >= totalPages) return;
    try {
      setIsLoadingMore(true);
      const next = page + 1;
      const res = await dishService.search({
        page: next,
        limit: 12,
        sortBy: sortBy === "price" ? "price" : "name",
        sortOrder: "ASC",
        name: searchQuery || undefined,
        active: true,
      });
      const data = res.data;
      setDishes((prev) => [...prev, ...(data.items || [])]);
      setTotalPages(data.totalPages || totalPages);
      setPage(data.currentPage || next);
    } catch (e) {
      // ignore
    } finally {
      setIsLoadingMore(false);
    }
  }, [isLoadingMore, page, totalPages, searchQuery, sortBy]);

  // Reset and fetch when dialog opens or filters change
  useEffect(() => {
    if (!open) return;
    const id = setTimeout(() => {
      loadDishes();
    }, 150);
    return () => clearTimeout(id);
  }, [open, loadDishes]);

  // Infinite scroll
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    if (target.scrollTop + target.clientHeight >= target.scrollHeight - 100) {
      loadMore();
    }
  };

  const handleDishClick = (dish: Dish) => {
    const payload: SelectableDish = {
      id: dish.id,
      name: dish.name,
      price: dish.price,
      media_urls: dish.media_urls || [],
      description: dish.description,
    };
    onSelectDish(payload);
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

            {/* Sort */}
            <div className="flex items-center gap-2 text-sm">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Sắp xếp:</span>
              <div className="flex gap-2">
                {(["name", "price"] as const).map((sort) => (
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
                  </Button>
                ))}
              </div>
            </div>
          </div>

          {/* Dishes List */}
          <div
            className="flex-1 overflow-y-auto px-6 py-4"
            onScroll={handleScroll}
          >
            {isLoading ? (
              <div className="flex items-center justify-center py-12 text-muted-foreground">
                <Loader2 className="h-5 w-5 mr-2 animate-spin" /> Đang tải món
                ăn...
              </div>
            ) : dishes.length > 0 ? (
              <div className="space-y-3">
                <AnimatePresence>
                  {dishes.map((dish, index) => {
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
                                  src={
                                    dish.media_urls?.[0] || "/placeholder.svg"
                                  }
                                  alt={dish.name}
                                  fill
                                  className="object-cover"
                                />
                              </div>

                              {/* Dish Info */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between mb-2">
                                  <div className="flex-1 min-w-0">
                                    <h3 className="font-bold text-lg text-primary mb-1 line-clamp-1">
                                      {dish.name}
                                    </h3>
                                    {dish.description && (
                                      <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                                        {dish.description}
                                      </p>
                                    )}
                                  </div>
                                  <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0 ml-2" />
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
                                      handleDishClick(dish);
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

                {page < totalPages && (
                  <div className="flex items-center justify-center py-4 text-muted-foreground">
                    {isLoadingMore ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Đang
                        tải thêm...
                      </>
                    ) : (
                      <Button variant="outline" size="sm" onClick={loadMore}>
                        Tải thêm
                      </Button>
                    )}
                  </div>
                )}
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

      {/* Detail sheet removed for API version to keep dialog light */}
    </>
  );
}
