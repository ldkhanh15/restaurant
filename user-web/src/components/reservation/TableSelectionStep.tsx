"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
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
import {
  MapPin,
  List,
  Eye,
  Users,
  Star,
  Search,
  Filter,
  Loader2,
} from "lucide-react";
import { useReservationStore } from "@/store/reservationStore";
import FloorMap from "@/components/FloorMap";
import { cn } from "@/lib/utils";
import { tableService, type Table } from "@/services/tableService";
import { toast } from "@/hooks/use-toast";
import {
  slideInRight,
  containerVariants,
  itemVariants,
  cardVariants,
  viewportOptions,
} from "@/lib/motion-variants";

const statusOptions = [
  { value: "all", label: "Tất cả" },
  { value: "available", label: "Còn trống" },
  { value: "reserved", label: "Đã đặt" },
  { value: "occupied", label: "Đang dùng" },
  { value: "cleaning", label: "Đang dọn" },
];

type EnrichedTable = Table & {
  floorId: string;
  floorNumber: number;
  floorLabel: string;
  isVIP: boolean;
  amenities: string[];
};

export default function TableSelectionStep() {
  const { draft, updateDraft } = useReservationStore();
  const [viewMode, setViewMode] = useState<"map" | "list">("map");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [capacityFilter, setCapacityFilter] = useState("all");
  const [tables, setTables] = useState<EnrichedTable[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const parseLocation = (location: Table["location"]) => {
    if (!location) return undefined;
    if (typeof location === "string") {
      try {
        return JSON.parse(location);
      } catch (err) {
        console.error("Failed to parse table location", err);
        return undefined;
      }
    }
    return location as any;
  };

  const loadTables = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await tableService.getAll({ all: true });
      const payload = (response as any)?.data ?? response;
      const rawTables: Table[] = Array.isArray(payload)
        ? payload
        : Array.isArray(payload?.data)
        ? payload.data
        : Array.isArray(payload?.items)
        ? payload.items
        : Array.isArray(payload?.data?.data)
        ? payload.data.data
        : [];

      const enriched: EnrichedTable[] = rawTables.map((table: any) => {
        const location = parseLocation(table.location);
        const floorNumber = location?.floor ?? 1;
        const floorId = `floor-${floorNumber}`;
        const floorLabel = location?.area
          ? `${location.area} · Tầng ${floorNumber}`
          : `Tầng ${floorNumber}`;
        const amenities = Array.isArray(table.amenities)
          ? table.amenities
          : typeof table.amenities === "string"
          ? [table.amenities]
          : [];
        const isVIP = amenities.some((amenity: string) =>
          amenity?.toLowerCase().includes("vip")
        );

        return {
          ...table,
          location,
          amenities,
          floorId,
          floorNumber,
          floorLabel,
          isVIP,
        } as EnrichedTable;
      });

      setTables(enriched);
    } catch (err: any) {
      console.error("Failed to load tables:", err);
      setError(
        err.response?.data?.message ||
          err.message ||
          "Không thể tải danh sách bàn"
      );
      toast({
        title: "Lỗi",
        description: "Không thể tải danh sách bàn. Vui lòng thử lại.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTables();
  }, [loadTables]);

  const floors = useMemo(() => {
    const floorMap = new Map<
      string,
      { id: string; label: string; floorNumber: number }
    >();
    tables.forEach((table) => {
      if (!floorMap.has(table.floorId)) {
        floorMap.set(table.floorId, {
          id: table.floorId,
          label: table.floorLabel,
          floorNumber: table.floorNumber,
        });
      }
    });
    return Array.from(floorMap.values()).sort(
      (a, b) => a.floorNumber - b.floorNumber
    );
  }, [tables]);

  useEffect(() => {
    if (
      floors.length > 0 &&
      (!draft.selected_floor ||
        !floors.some((floor) => floor.id === draft.selected_floor))
    ) {
      updateDraft({ selected_floor: floors[0].id });
    }
  }, [floors, draft.selected_floor, updateDraft]);

  const currentFloorTables = useMemo(() => {
    const currentFloorId = draft.selected_floor || floors[0]?.id;
    return tables
      .filter((table) => table.floorId === currentFloorId)
      .map((table) => ({
        ...table,
        floor_name: table.floorLabel,
      }));
  }, [draft.selected_floor, floors, tables]);

  const filteredTables = useMemo(() => {
    return currentFloorTables
      .filter((table) => {
        if (capacityFilter !== "all") {
          const minCapacity = parseInt(capacityFilter, 10);
          if (table.capacity < minCapacity) return false;
        }

        if (statusFilter !== "all" && table.status !== statusFilter) {
          return false;
        }

        if (searchQuery) {
          const query = searchQuery.toLowerCase();
          const matchesNumber = table.table_number
            ?.toLowerCase()
            .includes(query);
          const matchesFloor = table.floor_name.toLowerCase().includes(query);
          if (!matchesNumber && !matchesFloor) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        if (a.status === "available" && b.status !== "available") return -1;
        if (a.status !== "available" && b.status === "available") return 1;
        return a.capacity - b.capacity;
      });
  }, [currentFloorTables, capacityFilter, statusFilter, searchQuery]);

  const handleTableSelect = (tableId: string) => {
    const table = tables.find((t) => t.id === tableId);
    if (table) {
      updateDraft({
        selected_table_id: table.id,
        selected_table_name: table.table_number,
        selected_floor: table.floorId,
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
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            {floors.length > 0 ? (
              <Tabs
                value={draft.selected_floor || floors[0].id}
                onValueChange={(value) =>
                  updateDraft({ selected_floor: value })
                }
                className="w-full"
              >
                <TabsList className="flex flex-wrap gap-2 bg-muted/50 p-1">
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
                        {floor.label}
                      </TabsTrigger>
                    </motion.div>
                  ))}
                </TabsList>
              </Tabs>
            ) : (
              <div className="text-sm text-muted-foreground">
                Hiện chưa có dữ liệu sơ đồ bàn.
              </div>
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-wrap items-center justify-between gap-4"
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

            {viewMode === "list" && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="flex flex-wrap gap-2"
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

          {viewMode === "list" && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="relative"
            >
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Tìm kiếm bàn..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 border-accent/20 focus:border-accent transition-all duration-200"
              />
            </motion.div>
          )}

          <AnimatePresence mode="wait">
            {viewMode === "map" ? (
              <motion.div
                key="map"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3 }}
              >
                {isLoading ? (
                  <div className="flex items-center justify-center h-[600px]">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : error ? (
                  <div className="flex items-center justify-center h-[600px] text-center">
                    <div>
                      <p className="text-red-600 mb-2">{error}</p>
                      <Button onClick={loadTables} variant="outline">
                        Thử lại
                      </Button>
                    </div>
                  </div>
                ) : (
                  <FloorMap
                    floorId={draft.selected_floor || floors[0]?.id || "floor-1"}
                    selectedTableId={draft.selected_table_id}
                    onTableSelect={handleTableSelect}
                    showSidebar
                    tables={tables}
                  />
                )}
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
                {isLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : error ? (
                  <div className="text-center py-12">
                    <p className="text-red-600 mb-4">{error}</p>
                    <Button onClick={loadTables} variant="outline">
                      Thử lại
                    </Button>
                  </div>
                ) : filteredTables.length > 0 ? (
                  <div className="grid md:grid-cols-2 gap-4">
                    {filteredTables.map((table, index) => {
                      const isSelected = table.id === draft.selected_table_id;
                      const statusColors: Record<string, string> = {
                        available:
                          "bg-green-500/20 text-green-600 border-green-500/30",
                        reserved:
                          "bg-yellow-500/20 text-yellow-600 border-yellow-500/30",
                        occupied:
                          "bg-red-500/20 text-red-600 border-red-500/30",
                        cleaning:
                          "bg-blue-500/20 text-blue-600 border-blue-500/30",
                        default:
                          "bg-muted text-muted-foreground border-muted-foreground/20",
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
                                      {table.table_number ||
                                        `Bàn ${table.id.slice(0, 8)}`}
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

                              <Badge
                                className={cn(
                                  "w-fit text-xs mb-3",
                                  statusColors[table.status] ||
                                    statusColors.default
                                )}
                              >
                                {table.status === "available" && "Còn trống"}
                                {table.status === "reserved" && "Đã đặt"}
                                {table.status === "occupied" && "Đang dùng"}
                                {table.status === "cleaning" && "Đang dọn"}
                              </Badge>

                              {typeof table.deposit === "number" &&
                                table.deposit > 0 && (
                                  <Badge
                                    variant="outline"
                                    className="text-xs border-accent/30 text-accent mb-3"
                                  >
                                    Cọc: {table.deposit.toLocaleString("vi-VN")}
                                    đ
                                  </Badge>
                                )}

                              {table.amenities &&
                                table.amenities.length > 0 && (
                                  <div className="mt-4 pt-4 border-t border-border/50">
                                    <div className="flex flex-wrap gap-1">
                                      {table.amenities.map((feature, idx) => (
                                        <Badge
                                          key={`${table.id}-feature-${idx}`}
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
