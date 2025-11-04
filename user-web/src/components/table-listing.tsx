"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Star,
  Users,
  MapPin,
  Eye,
  List,
  Search,
  Filter,
  Calendar,
  Utensils,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import FloorMap from "@/components/FloorMap";
import { mockTables } from "@/mock/mockTables";

const floors = [
  { id: "floor-1", name: "Tầng 1", description: "Khu vực chính" },
  { id: "floor-2", name: "Tầng 2", description: "Khu VIP" },
];

const statusOptions = [
  { value: "all", label: "Tất cả" },
  { value: "available", label: "Còn trống" },
  { value: "reserved", label: "Đã đặt" },
  { value: "occupied", label: "Đang dùng" },
];

const capacityOptions = [
  { value: "all", label: "Tất cả" },
  { value: "2", label: "2 người" },
  { value: "4", label: "4 người" },
  { value: "6", label: "6 người" },
  { value: "8", label: "8+ người" },
];

export default function TableListing() {
  const router = useRouter();
  const [viewMode, setViewMode] = useState<"map" | "list">("map");
  const [selectedFloor, setSelectedFloor] = useState("floor-1");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [capacityFilter, setCapacityFilter] = useState("all");
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null);

  const filteredTables = useMemo(() => {
    let filtered = mockTables.filter((table) => {
      // Filter by floor
      if (table.floor_id !== selectedFloor) return false;

      // Filter by capacity
      if (capacityFilter !== "all") {
        const minCapacity = parseInt(capacityFilter);
        if (table.capacity < minCapacity) return false;
      }

      // Filter by status
      if (statusFilter !== "all") {
        if (table.status !== statusFilter) return false;
      }

      // Filter by search query
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        if (
          !table.name.toLowerCase().includes(query) &&
          !table.floor_name.toLowerCase().includes(query)
        ) {
          return false;
        }
      }

      return true;
    });

    // Sort: available first, then by capacity
    return filtered.sort((a, b) => {
      if (a.status === "available" && b.status !== "available") return -1;
      if (a.status !== "available" && b.status === "available") return 1;
      return a.capacity - b.capacity;
    });
  }, [selectedFloor, statusFilter, capacityFilter, searchQuery]);

  const handleTableSelect = (tableId: string) => {
    setSelectedTableId(tableId);
    router.push(`/tables/${tableId}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-cream-50 to-cream-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-gradient-gold rounded-full flex items-center justify-center shadow-lg">
              <Utensils className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-elegant text-4xl md:text-5xl font-bold text-primary">
                Bàn Ăn
              </h1>
              <p className="text-muted-foreground font-serif italic">
                Chọn bàn phù hợp cho bữa ăn của bạn
              </p>
            </div>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center justify-between mb-6">
            <Tabs
              value={selectedFloor}
              onValueChange={setSelectedFloor}
              className="w-fit"
            >
              <TabsList className="bg-muted/50">
                {floors.map((floor) => (
                  <TabsTrigger
                    key={floor.id}
                    value={floor.id}
                    className="data-[state=active]:bg-gradient-gold data-[state=active]:text-primary-foreground"
                  >
                    {floor.name}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>

            <div className="flex gap-2">
              <Button
                variant={viewMode === "map" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("map")}
                className={cn(
                  viewMode === "map" &&
                    "bg-gradient-gold text-primary-foreground hover:opacity-90"
                )}
              >
                <Eye className="h-4 w-4 mr-2" />
                Sơ Đồ
              </Button>
              <Button
                variant={viewMode === "list" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("list")}
                className={cn(
                  viewMode === "list" &&
                    "bg-gradient-gold text-primary-foreground hover:opacity-90"
                )}
              >
                <List className="h-4 w-4 mr-2" />
                Danh Sách
              </Button>
            </div>
          </div>

          {/* Filters - Only show in List View */}
          {viewMode === "list" && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="grid md:grid-cols-3 gap-4"
            >
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Tìm kiếm bàn..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 border-accent/20 focus:border-accent"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="border-accent/20 focus:border-accent">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Trạng thái" />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={capacityFilter} onValueChange={setCapacityFilter}>
                <SelectTrigger className="border-accent/20 focus:border-accent">
                  <Users className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Sức chứa" />
                </SelectTrigger>
                <SelectContent>
                  {capacityOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </motion.div>
          )}
        </motion.div>

        {/* Map or List View */}
        <AnimatePresence mode="wait">
          {viewMode === "map" ? (
            <motion.div
              key="map"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3 }}
            >
              <FloorMap
                floorId={selectedFloor}
                selectedTableId={selectedTableId}
                onTableSelect={handleTableSelect}
                showSidebar={true}
              />
            </motion.div>
          ) : (
            <motion.div
              key="list"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.3 }}
            >
              {filteredTables.length > 0 ? (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredTables.map((table, index) => {
                    const statusColors = {
                      available:
                        "bg-green-500/20 text-green-600 border-green-500/30",
                      reserved:
                        "bg-yellow-500/20 text-yellow-600 border-yellow-500/30",
                      occupied: "bg-red-500/20 text-red-600 border-red-500/30",
                    };

                    return (
                      <motion.div
                        key={table.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        whileHover={{ scale: 1.02, y: -4 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <Card
                          className={cn(
                            "cursor-pointer border-2 h-full transition-all shadow-md hover:shadow-xl",
                            selectedTableId === table.id
                              ? "border-accent ring-4 ring-accent/20 bg-gradient-to-br from-card to-accent/5"
                              : "border-border hover:border-accent/50"
                          )}
                          onClick={() => handleTableSelect(table.id)}
                        >
                          <CardContent className="p-6">
                            <div className="flex items-start justify-between mb-4">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <h3 className="font-bold text-xl text-primary font-elegant">
                                    {table.name}
                                  </h3>
                                  {table.isVIP && (
                                    <Badge className="bg-gradient-gold text-primary-foreground border-0">
                                      <Star className="h-3 w-3 mr-1 fill-current" />
                                      VIP
                                    </Badge>
                                  )}
                                </div>
                                <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                                  <div className="flex items-center gap-1">
                                    <Users className="h-4 w-4" />
                                    <span>{table.capacity} người</span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <MapPin className="h-4 w-4" />
                                    <span>{table.floor_name}</span>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Status Badge */}
                            <Badge
                              className={cn(
                                "w-fit text-xs mb-3",
                                statusColors[table.status]
                              )}
                            >
                              {table.status === "available" && "Còn trống"}
                              {table.status === "reserved" && "Đã đặt"}
                              {table.status === "occupied" && "Đang dùng"}
                            </Badge>

                            {/* Features */}
                            {table.features && table.features.length > 0 && (
                              <div className="mt-4 pt-4 border-t border-border/50">
                                <div className="flex flex-wrap gap-1">
                                  {table.features.map((feature, idx) => (
                                    <Badge
                                      key={idx}
                                      variant="outline"
                                      className="text-xs border-accent/20"
                                    >
                                      {feature}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            )}

                            <Button
                              variant="outline"
                              className="w-full mt-4 border-accent/20 hover:bg-accent/10"
                              size="sm"
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              Xem Chi Tiết
                            </Button>
                          </CardContent>
                        </Card>
                      </motion.div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12">
                  <MapPin className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <p className="text-muted-foreground text-lg">
                    Không tìm thấy bàn phù hợp
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Thử thay đổi bộ lọc hoặc chọn tầng khác
                  </p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
