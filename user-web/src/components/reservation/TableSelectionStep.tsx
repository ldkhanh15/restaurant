"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { MapPin, List, Eye, Users, Star, Search, Filter } from "lucide-react";
import { useReservationStore } from "@/store/reservationStore";
import FloorMap from "@/components/FloorMap";
import { cn } from "@/lib/utils";
import { mockTables } from "@/mock/mockTables";
import { getTablesByFloor } from "@/mock/mockTables";
import {
  slideInRight,
  containerVariants,
  itemVariants,
  cardVariants,
  viewportOptions,
} from "@/lib/motion-variants";

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

export default function TableSelectionStep() {
  const { draft, updateDraft } = useReservationStore();
  const [viewMode, setViewMode] = useState<"map" | "list">("map");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [capacityFilter, setCapacityFilter] = useState("all");

  const currentFloorTables = useMemo(() => {
    return getTablesByFloor(draft.selected_floor || "floor-1");
  }, [draft.selected_floor]);

  const filteredTables = useMemo(() => {
    let filtered = currentFloorTables.filter((table) => {
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
  }, [currentFloorTables, statusFilter, capacityFilter, searchQuery]);

  const availableTables = filteredTables.filter(
    (table) => table.capacity >= draft.num_people
  );

  const handleTableSelect = (tableId: string) => {
    const table = mockTables.find((t) => t.id === tableId);
    if (table) {
      updateDraft({
        selected_table_id: table.id,
        selected_table_name: table.name,
        selected_floor: table.floor_id,
      });
    }
  };

  return (
    <motion.div
      variants={slideInRight}
      initial="hidden"
      animate="visible"
      exit={{ opacity: 0, x: -50 }}
      transition={{ duration: 0.4 }}
    >
      <Card className="border-2 border-accent/20 shadow-lg">
        <CardHeader>
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <CardTitle className="flex items-center gap-2 font-elegant text-2xl">
              <motion.div
                whileHover={{ rotate: 360, scale: 1.1 }}
                transition={{ duration: 0.5 }}
              >
                <MapPin className="h-6 w-6 text-accent" />
              </motion.div>
              Chọn Bàn
            </CardTitle>
            <CardDescription className="text-base mt-2">
              Chọn bàn phù hợp với số lượng khách của bạn
            </CardDescription>
          </motion.div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Floor Selection */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Tabs
              value={draft.selected_floor || "floor-1"}
              onValueChange={(value) => updateDraft({ selected_floor: value })}
              className="w-full"
            >
              <TabsList className="grid w-full grid-cols-2 bg-muted/50">
                {floors.map((floor) => (
                  <motion.div
                    key={floor.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <TabsTrigger
                      value={floor.id}
                      className="data-[state=active]:bg-gradient-gold data-[state=active]:text-primary-foreground transition-all duration-200"
                    >
                      {floor.name}
                    </TabsTrigger>
                  </motion.div>
                ))}
              </TabsList>
            </Tabs>
          </motion.div>

          {/* View Mode Toggle */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex items-center justify-between gap-4"
          >
            <div className="flex gap-2">
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  variant={viewMode === "map" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setViewMode("map")}
                  className={cn(
                    viewMode === "map" &&
                      "bg-gradient-gold text-primary-foreground hover:opacity-90",
                    "border-accent/20"
                  )}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Sơ Đồ
                </Button>
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  variant={viewMode === "list" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setViewMode("list")}
                  className={cn(
                    viewMode === "list" &&
                      "bg-gradient-gold text-primary-foreground hover:opacity-90",
                    "border-accent/20"
                  )}
                >
                  <List className="h-4 w-4 mr-2" />
                  Danh Sách
                </Button>
              </motion.div>
            </div>

            {/* Filters - Only show in List View */}
            {viewMode === "list" && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="flex gap-2"
              >
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-40 border-accent/20 focus:border-accent">
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
                <Select
                  value={capacityFilter}
                  onValueChange={setCapacityFilter}
                >
                  <SelectTrigger className="w-40 border-accent/20 focus:border-accent">
                    <Users className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Sức chứa" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất cả</SelectItem>
                    <SelectItem value="2">2 người</SelectItem>
                    <SelectItem value="4">4 người</SelectItem>
                    <SelectItem value="6">6 người</SelectItem>
                    <SelectItem value="8">8+ người</SelectItem>
                  </SelectContent>
                </Select>
              </motion.div>
            )}
          </motion.div>

          {/* Search - Only show in List View */}
          {viewMode === "list" && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="relative"
            >
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Tìm kiếm bàn..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 border-accent/20 focus:border-accent transition-all duration-200"
              />
            </motion.div>
          )}

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
                  floorId={draft.selected_floor || "floor-1"}
                  selectedTableId={draft.selected_table_id}
                  onTableSelect={handleTableSelect}
                  showSidebar={true}
                />
              </motion.div>
            ) : (
              <motion.div
                key="list"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                exit={{ opacity: 0, y: 20 }}
                transition={{ duration: 0.3 }}
              >
                {filteredTables.length > 0 ? (
                  <div className="grid md:grid-cols-2 gap-4">
                    {filteredTables.map((table, index) => {
                      const isSelected = table.id === draft.selected_table_id;
                      const statusColors = {
                        available:
                          "bg-green-500/20 text-green-600 border-green-500/30",
                        reserved:
                          "bg-yellow-500/20 text-yellow-600 border-yellow-500/30",
                        occupied:
                          "bg-red-500/20 text-red-600 border-red-500/30",
                      };

                      return (
                        <motion.div
                          key={table.id}
                          variants={cardVariants}
                          initial="hidden"
                          animate="visible"
                          whileHover="hover"
                          whileTap="tap"
                          custom={index}
                          viewport={viewportOptions}
                        >
                          <Card
                            className={cn(
                              "cursor-pointer border-2 h-full transition-all shadow-md",
                              isSelected
                                ? "border-accent ring-4 ring-accent/20 bg-gradient-to-br from-card to-accent/5 shadow-xl"
                                : "border-border hover:border-accent/50 hover:shadow-xl"
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
                                      <motion.div
                                        whileHover={{ rotate: 360 }}
                                        transition={{ duration: 0.5 }}
                                      >
                                        <Badge className="bg-gradient-gold text-primary-foreground border-0">
                                          <Star className="h-3 w-3 mr-1 fill-current" />
                                          VIP
                                        </Badge>
                                      </motion.div>
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

                              {isSelected && (
                                <motion.div
                                  initial={{ opacity: 0, scale: 0.8 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  className="mt-4 pt-4 border-t border-accent/30"
                                >
                                  <div className="flex items-center gap-2 text-sm text-accent font-semibold">
                                    <motion.div
                                      animate={{ rotate: 360 }}
                                      transition={{
                                        duration: 2,
                                        repeat: Infinity,
                                        ease: "linear",
                                      }}
                                    >
                                      ✓
                                    </motion.div>
                                    <span>Đã chọn</span>
                                  </div>
                                </motion.div>
                              )}
                            </CardContent>
                          </Card>
                        </motion.div>
                      );
                    })}
                  </div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center py-12"
                  >
                    <MapPin className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                    <p className="text-muted-foreground">
                      Không tìm thấy bàn phù hợp
                    </p>
                    <p className="text-sm text-muted-foreground mt-2">
                      Thử thay đổi bộ lọc hoặc chọn tầng khác
                    </p>
                  </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </motion.div>
  );
}
