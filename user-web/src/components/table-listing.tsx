"use client";

import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
  Eye,
  List,
  Search,
  Filter,
  Utensils,
  Wifi,
  Zap,
  Music,
  Snowflake,
  Clock,
  DollarSign,
  Users,
  MapPin,
  Sparkles,
  Plus,
  X,
  Calendar,
  User,
  Phone,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { tableService } from "@/services/tableService";
import { TableMapView } from "./table-map-view";

// === CẤU TRÚC DỮ LIỆU ===
export interface Table {
  id: string;
  table_number: string;
  description?: string;
  capacity: number;
  status: "available" | "reserved" | "occupied";
  deposit: number;
  cancel_minutes: number;
  location: {
    floor: number;
    area: string;
    coordinates: { x: number; y: number };
  };
  amenities: Record<string, boolean>;
  panorama_urls?: string[] | null;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
}

const itemsPerPage = 9;

const amenityConfig: Record<
  string,
  { icon: JSX.Element; label: string } | null
> = {
  wifi: { icon: <Wifi className="h-3 w-3" />, label: "WiFi" },
  outlet: { icon: <Zap className="h-3 w-3" />, label: "Ổ cắm" },
  near_stage: { icon: <Music className="h-3 w-3" />, label: "Gần sân khấu" },
  air_conditioner: {
    icon: <Snowflake className="h-3 w-3" />,
    label: "Điều hòa",
  },
  window_view: { icon: <MapPin className="h-3 w-3" />, label: "View đẹp" },
  private: { icon: <Sparkles className="h-3 w-3" />, label: "Riêng tư" },
  smoking: { icon: <Sparkles className="h-3 w-3" />, label: "Hút thuốc" },
};

// === ZOD SCHEMA CHO FORM ĐẶT BÀN ===
const bookingSchema = z.object({
  name: z.string().min(2, "Tên ít nhất 2 ký tự"),
  phone: z.string().regex(/^0[3|5|7|8|9]\d{8}$/, "Số điện thoại không hợp lệ"),
  guests: z.string().min(1, "Chọn số người"),
  date: z.string().min(1, "Chọn ngày"),
  time: z.string().min(1, "Chọn giờ"),
});

type BookingForm = z.infer<typeof bookingSchema>;

export default function TableListing() {
  const router = useRouter();
  const [viewMode, setViewMode] = useState<"map" | "list">("map");
  const [selectedFloor, setSelectedFloor] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [capacityFilter, setCapacityFilter] = useState("all");
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [allTables, setAllTables] = useState<Table[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState<
    "name" | "capacity_asc" | "capacity_desc"
  >("name");
  const [selectedTableForBooking, setSelectedTableForBooking] =
    useState<Table | null>(null);
  const [isBookingOpen, setIsBookingOpen] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<BookingForm>({
    resolver: zodResolver(bookingSchema),
  });

  // Lấy dữ liệu
  useEffect(() => {
    const fetchAllTables = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await tableService.getAllNoPagination();
        if (!response) throw new Error("Không thể tải danh sách bàn");
        const tables: Table[] = response.data || [];
        setAllTables(tables.filter((t) => !t.deleted_at));
      } catch (err) {
        setError(err instanceof Error ? err.message : "Lỗi tải dữ liệu");
        setAllTables([]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchAllTables();
  }, []);

  // === ĐỒNG BỘ TẦNG THEO VIEW MODE ===
  const { floors } = useMemo(() => {
    const floorsSet = new Set<number>();
    allTables.forEach((table) => floorsSet.add(table.location.floor));

    const floors = Array.from(floorsSet)
      .sort((a, b) => {
        if (a === 1) return -1;
        if (b === 1) return 1;
        return a - b;
      })
      .map((f) => ({
        id: String(f),
        name: `Tầng ${f}`,
      }));

    return { floors };
  }, [allTables]);

  useEffect(() => {
    if (viewMode === "map") {
      const firstFloor = floors.find(f => f.id === "1")?.id || floors[0]?.id || "all";
      if (selectedFloor !== firstFloor) {
        setSelectedFloor(firstFloor);
      }
    } else {
      if (selectedFloor !== "all") {
        setSelectedFloor("all");
      }
    }
  }, [viewMode, floors]);

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedFloor, statusFilter, capacityFilter, searchQuery, sortBy]);

  // Tạo filter options
  const { statusOptions, capacityOptions } = useMemo(() => {
    const statusSet = new Set<string>();
    const capacitySet = new Set<number>();

    allTables.forEach((table) => {
      statusSet.add(table.status);
      capacitySet.add(table.capacity);
    });

    const statusOptions = [
      { value: "all", label: "Tất cả" },
      ...Array.from(statusSet).map((s) => ({
        value: s,
        label:
          s === "available"
            ? "Còn trống"
            : s === "reserved"
            ? "Đã đặt"
            : "Đang dùng",
      })),
    ];

    const capacityOptions = [
      { value: "all", label: "Tất cả" },
      ...Array.from(capacitySet)
        .sort((a, b) => a - b)
        .map((c) => ({
          value: String(c),
          label: c <= 8 ? `${c} người` : "8+ người",
        })),
    ];

    return { statusOptions, capacityOptions };
  }, [allTables]);

  // Lọc & sắp xếp
  const filteredAndSortedTables = useMemo(() => {
    let filtered = allTables.filter((table) => {
      const floorStr = String(table.location.floor);
      const matchesFloor =
        selectedFloor === "all" || floorStr === selectedFloor;
      const searchLower = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !searchLower ||
        table.table_number.toLowerCase().includes(searchLower) ||
        (table.description &&
          table.description.toLowerCase().includes(searchLower)) ||
        table.location.area.toLowerCase().includes(searchLower);
      const matchesStatus =
        statusFilter === "all" || table.status === statusFilter;
      const capacity = parseInt(capacityFilter);
      const matchesCapacity =
        capacityFilter === "all" ||
        (capacity <= 8 && table.capacity === capacity) ||
        (capacity === 8 && table.capacity >= 8);

      return matchesFloor && matchesSearch && matchesStatus && matchesCapacity;
    });

    filtered.sort((a, b) => {
      if (sortBy === "name")
        return a.table_number.localeCompare(b.table_number);
      if (sortBy === "capacity_asc") return a.capacity - b.capacity;
      if (sortBy === "capacity_desc") return b.capacity - a.capacity;
      return 0;
    });

    return filtered;
  }, [
    allTables,
    selectedFloor,
    searchQuery,
    statusFilter,
    capacityFilter,
    sortBy,
  ]);

  const totalItems = filteredAndSortedTables.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const displayTables = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredAndSortedTables.slice(start, start + itemsPerPage);
  }, [filteredAndSortedTables, currentPage]);

  const handleTableSelect = (tableId: string) => {
    setSelectedTableId(tableId);
    router.push(`/tables/${tableId}`);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const openBookingModal = (table: Table) => {
    setSelectedTableForBooking(table);
    setIsBookingOpen(true);
    reset();
  };

  const onSubmitBooking = (data: BookingForm) => {
    console.log("Đặt bàn thành công:", {
      table: selectedTableForBooking,
      booking: data,
    });
    setIsBookingOpen(false);
    alert(`Đã đặt bàn ${selectedTableForBooking?.table_number} thành công!`);
  };

  const renderAmenity = (key: string, value: boolean) => {
    if (!value) return null;
    const config = amenityConfig[key];
    const label =
      config?.label ||
      key.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
    const icon = config?.icon || <Sparkles className="h-3 w-3" />;
    return (
      <Badge
        key={key}
        variant="secondary"
        className="text-xs flex items-center gap-1"
      >
        {icon} <span>{label}</span>
      </Badge>
    );
  };

  if (isLoading)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-12 w-12 border-b-2 border-primary rounded-full"></div>
      </div>
    );
  if (error)
    return <div className="text-center py-12 text-red-600">{error}</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-cream-50 to-cream-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
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

          <div className="flex flex-col sm:flex-row justify-between gap-4 mb-6">
            <Tabs value={selectedFloor} onValueChange={setSelectedFloor}>
              <TabsList className="bg-muted/50">
                <TabsTrigger
                  value="all"
                  disabled={viewMode === "map"}
                  className={cn(
                    "transition-all",
                    viewMode === "map" && "opacity-50 cursor-not-allowed"
                  )}
                >
                  Tất cả
                </TabsTrigger>
                {floors.map((f) => (
                  <TabsTrigger
                    key={f.id}
                    value={f.id}
                    className="data-[state=active]:bg-gradient-gold data-[state=active]:text-primary-foreground"
                  >
                    {f.name}
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
                <Eye className="h-4 w-4 mr-2" /> Sơ Đồ
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
                <List className="h-4 w-4 mr-2" /> Danh Sách
              </Button>
          </div>
        </div>

          {viewMode === "list" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="grid md:grid-cols-4 gap-4 mb-6"
            >
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Tìm kiếm..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={capacityFilter} onValueChange={setCapacityFilter}>
                <SelectTrigger>
                  <Users className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {capacityOptions.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={sortBy} onValueChange={(v) => setSortBy(v as any)}>
                <SelectTrigger>
                  <SelectValue placeholder="Sắp xếp" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name">Tên (A-Z)</SelectItem>
                  <SelectItem value="capacity_asc">
                    Sức chứa tăng dần
                  </SelectItem>
                  <SelectItem value="capacity_desc">
                    Sức chứa giảm dần
                  </SelectItem>
                </SelectContent>
              </Select>
            </motion.div>
          )}
        </motion.div>

        <AnimatePresence mode="wait">
          {viewMode === "list" ? (
            <motion.div
              key="list"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {displayTables.length > 0 ? (
                <>
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {displayTables.map((table, i) => {
                      const isAvailable = table.status === "available";
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
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.05 }}
                          whileHover={{ scale: 1.02, y: -4 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <Card
                            className={cn(
                              "cursor-pointer border-2 h-full shadow-md hover:shadow-xl transition-all",
                              selectedTableId === table.id
                                ? "border-accent ring-4 ring-accent/20"
                                : "border-border"
                            )}
                            onClick={() => handleTableSelect(table.id)}
                          >
                            <CardContent className="p-6">
                              <div className="flex items-center justify-between mb-4">
                                <h3 className="font-bold text-xl text-primary font-elegant">
                                  {table.table_number}
                                </h3>
                                {isAvailable && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      openBookingModal(table);
                                    }}
                                    className="ml-2 p-2 bg-green-500 hover:bg-green-600 text-white rounded-full shadow-lg transition-all hover:scale-110"
                                  >
                                    <Plus className="h-4 w-4" />
                                  </button>
                                )}
                              </div>

                              <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                                <div className="flex items-center gap-1">
                                  <Users className="h-4 w-4" />
                                  <span>{table.capacity} người</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <MapPin className="h-4 w-4" />
                                  <span>Tầng {table.location.floor}</span>
                                </div>
                              </div>
                              {table.description && (
                                <p className="text-sm text-muted-foreground italic mb-3">
                                  {table.description}
                                </p>
                              )}

                              <Badge
                                className={cn(
                                  "w-fit text-xs mb-3",
                                  statusColors[table.status]
                                )}
                              >
                                {table.status === "available"
                                  ? "Còn trống"
                                  : table.status === "reserved"
                                  ? "Đã đặt"
                                  : "Đang dùng"}
                              </Badge>

                              <div className="flex flex-wrap gap-1 mb-3">
                                {Object.entries(table.amenities).map(([k, v]) =>
                                  renderAmenity(k, v)
                                )}
                              </div>

                              <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                                <div className="flex items-center gap-1">
                                  <DollarSign className="h-3 w-3" />
                                  <span>
                                    Đặt cọc: {table.deposit.toLocaleString()}đ
                                  </span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  <span>
                                    Hủy trước {table.cancel_minutes} phút
                                  </span>
                                </div>
                              </div>

                              <Button
                                variant="outline"
                                className="w-full mt-4"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleTableSelect(table.id);
                                }}
                              >
                                <Eye className="h-4 w-4 mr-2" /> Xem Chi Tiết
                              </Button>
                            </CardContent>
                          </Card>
                        </motion.div>
                      );
                    })}
                  </div>

                  {totalPages > 1 && (
                    <div className="flex justify-center gap-2 mt-8">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={currentPage === 1}
                        onClick={() => handlePageChange(currentPage - 1)}
                      >
                        Trước
                      </Button>
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                        (p) => (
                          <Button
                            key={p}
                            variant={currentPage === p ? "default" : "outline"}
                            size="sm"
                            onClick={() => handlePageChange(p)}
                            className={cn(
                              currentPage === p &&
                                "bg-gradient-gold text-primary-foreground"
                            )}
                          >
                            {p}
                          </Button>
                        )
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={currentPage === totalPages}
                        onClick={() => handlePageChange(currentPage + 1)}
                      >
                        Sau
                      </Button>
                    </div>
                  )}
                </>
              ) : (
          <div className="text-center py-12">
                  <MapPin className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <p className="text-lg text-muted-foreground">
                    Không tìm thấy bàn phù hợp
                  </p>
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="map"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <TableMapView
                tables={allTables}
                selectedFloor={selectedFloor}
                onTableClick={(table) =>
                  table.status === "available" && openBookingModal(table as any)
                }
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* MODAL ĐẶT BÀN */}
        <Dialog open={isBookingOpen} onOpenChange={setIsBookingOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>
                Đặt bàn {selectedTableForBooking?.table_number}
              </DialogTitle>
              <DialogDescription>
                Vui lòng nhập thông tin để đặt bàn. Chúng tôi sẽ liên hệ xác
                nhận sớm nhất.
              </DialogDescription>
            </DialogHeader>
            <form
              onSubmit={handleSubmit(onSubmitBooking)}
              className="space-y-4"
            >
              <div>
                <Label>Họ tên</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    {...register("name")}
                    placeholder="Nguyễn Văn A"
                    className="pl-10"
                  />
                </div>
                {errors.name && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.name.message}
                  </p>
                )}
              </div>

              <div>
                <Label>Số điện thoại</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    {...register("phone")}
                    placeholder="0901234567"
                    className="pl-10"
                  />
                </div>
                {errors.phone && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.phone.message}
                  </p>
                )}
              </div>

              <div>
                <Label>Số người</Label>
                <Select onValueChange={(v) => setValue("guests", v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn số người" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from(
                      { length: selectedTableForBooking?.capacity || 8 },
                      (_, i) => i + 1
                    ).map((n) => (
                      <SelectItem key={n} value={String(n)}>
                        {n} người
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.guests && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.guests.message}
                  </p>
                )}
              </div>

              <div>
                <Label>Ngày đặt</Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="date"
                    {...register("date")}
                    className="pl-10"
                    min={format(new Date(), "yyyy-MM-dd")}
                  />
                </div>
                {errors.date && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.date.message}
                  </p>
                )}
              </div>

              <div>
                <Label>Giờ đặt</Label>
                <Select onValueChange={(v) => setValue("time", v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn giờ" />
                  </SelectTrigger>
                  <SelectContent>
                    {[
                      "10:00",
                      "11:00",
                      "12:00",
                      "13:00",
                      "17:00",
                      "18:00",
                      "19:00",
                      "20:00",
                    ].map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.time && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.time.message}
                  </p>
                )}
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  type="submit"
                  className="flex-1 bg-gradient-gold hover:opacity-90"
                >
                  Xác nhận đặt bàn
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsBookingOpen(false)}
                >
                  Hủy
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}