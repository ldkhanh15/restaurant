// components/table/TableMapView.tsx
"use client";

import { useRef, useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { tableService } from "@/services/tableService";
import { toast } from "react-toastify";

export interface Table {
  id: string;
  table_number: string;
  capacity: number;
  status: "available" | "reserved" | "occupied";
  location: {
    floor: number;
    coordinates: { x: number; y: number };
  };
}

type AreaShape = "circle" | "square" | "rhombus" | "parallelogram" | "rectangle" | "polygon";

interface TableMapViewProps {
  tables: Table[];
  selectedFloor: string;
  onTableClick: (table: Table) => void;
}

export function TableMapView({
  tables,
  selectedFloor,
  onTableClick,
}: TableMapViewProps) {
  const floorPlanRef = useRef<HTMLDivElement>(null);
  const [containerRect, setContainerRect] = useState<DOMRect | null>(null);
  const [areaShape, setAreaShape] = useState<AreaShape>("rectangle"); // default
  const [isLoadingArea, setIsLoadingArea] = useState(true);

  // === LẤY SHAPE TỪ API ===
  useEffect(() => {
    const getArea = async () => {
      setIsLoadingArea(true);
      try {
        const response = await tableService.getArea();
        if (response?.data) {
          const shape = response.data.shape_type;
          if (isValidShape(shape)) {
            setAreaShape(shape);
          } else {
            console.warn("shape_type không hợp lệ:", shape);
            setAreaShape("rectangle");
          }
        } else {
          toast.error("Không tìm thấy thông tin khu vực");
          setAreaShape("rectangle");
        }
      } catch (err) {
        console.error("Lỗi khi tải area:", err);
        toast.error("Lỗi tải hình dạng khu vực");
        setAreaShape("rectangle");
      } finally {
        setIsLoadingArea(false);
      }
    };

    getArea();
  }, []);

  // === Validate shape_type ===
  const isValidShape = (shape: any): shape is AreaShape => {
    return [
      "circle",
      "square",
      "rhombus",
      "parallelogram",
      "rectangle",
      "polygon",
    ].includes(shape);
  };

  // === Cập nhật kích thước container ===
  useEffect(() => {
    const updateRect = () => {
      if (floorPlanRef.current) {
        setContainerRect(floorPlanRef.current.getBoundingClientRect());
      }
    };
    updateRect();
    window.addEventListener("resize", updateRect);
    return () => window.removeEventListener("resize", updateRect);
  }, [selectedFloor, areaShape]);

  // === Lọc bàn theo tầng ===
  const filteredTables = tables.filter((table) => {
    if (selectedFloor === "all") return true;
    if (selectedFloor === "unassigned") return table.location.floor == null;
    return table.location.floor === Number(selectedFloor);
  });

  // === Tính vị trí hiển thị ===
  const getDisplayPosition = (table: Table) => {
    const rawX = table.location.coordinates.x ?? 0;
    const rawY = table.location.coordinates.y ?? 0;

    if (!containerRect || !floorPlanRef.current) {
      return { x: rawX, y: rawY, isOutOfBounds: false };
    }

    const rect = floorPlanRef.current.getBoundingClientRect();
    const padding = 60;
    const tableSize = 80;
    const minX = padding;
    const maxX = rect.width - padding - tableSize;
    const minY = padding;
    const maxY = rect.height - padding - tableSize;

    const isOut = rawX < minX || rawX > maxX || rawY < minY || rawY > maxY;

    if (isOut) {
      const centerX = (rect.width - tableSize) / 2;
      const centerY = (rect.height - tableSize) / 2;
      return { x: centerX, y: centerY, isOutOfBounds: true };
    }

    return { x: rawX, y: rawY, isOutOfBounds: false };
  };

  // === Shape styles ===
  const shapeStyles: Record<AreaShape, { container: string; inner: string; clip?: string }> = {
    circle: { container: "rounded-full", inner: "", clip: undefined },
    square: { container: "aspect-square", inner: "", clip: undefined },
    rhombus: {
      container: "aspect-square rotate-[-30deg] skew-x-[25deg] overflow-hidden",
      inner: "rotate-[15deg] skew-x-[-15deg] scale-100",
      clip: undefined,
    },
    parallelogram: { container: "skew-x-20", inner: "skew-x-[-20deg]", clip: undefined },
    rectangle: { container: "", inner: "", clip: undefined },
    polygon: {
      container: "",
      inner: "",
      clip: "polygon(50% 0%, 100% 38%, 82% 100%, 18% 100%, 0% 38%)",
    },
  };

  const { container, inner, clip } = shapeStyles[areaShape];

  // === Loading state ===
  if (isLoadingArea) {
    return (
      <Card className="overflow-hidden">
        <CardContent className="p-8 flex items-center justify-center min-h-[600px]">
          <div className="text-center">
            <div className="animate-spin h-10 w-10 border-b-2 border-primary rounded-full mx-auto mb-4"></div>
            <p className="text-sm text-muted-foreground">Đang tải sơ đồ khu vực...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4 sm:p-8">
        <div className="flex justify-center">
          <div
            ref={floorPlanRef}
            className={`
              relative bg-gray-50 border-2 border-dashed border-gray-300
              shadow-xl overflow-hidden ${container}
              transition-all duration-500
            `}
            style={{
              ...(areaShape !== "rhombus" && { width: "100%" }),
              maxWidth: areaShape === "parallelogram" ? "900px" : "1400px",
              minHeight: "800px",
              clipPath: clip,
            }}
          >
            {/* Grid nền */}
            <div className="absolute inset-0 opacity-15 pointer-events-none z-0">
              <svg width="100%" height="100%" className="w-full h-full">
                <defs>
                  <pattern id="grid-view" width="40" height="40" patternUnits="userSpaceOnUse">
                    <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#999" strokeWidth="1" />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#grid-view)" />
              </svg>
            </div>

            {/* Bàn */}
            <div className={`absolute inset-6 ${inner} z-10`}>
              {filteredTables.map((table) => {
                const { x, y, isOutOfBounds } = getDisplayPosition(table);
                const isAvailable = table.status === "available";

                return (
                  <div
                    key={table.id}
                    style={{
                      position: "absolute",
                      left: `${x}px`,
                      top: `${y}px`,
                      transformOrigin: "center",
                      cursor: isAvailable ? "pointer" : "default",
                      opacity: isOutOfBounds ? 0.7 : 1,
                      outline: isOutOfBounds ? "2px dashed #f59e0b" : "none",
                    }}
                    onClick={() => isAvailable && onTableClick(table)}
                    className={`
                      w-20 h-20 bg-white border-2 rounded-lg shadow-md
                      flex items-center justify-center text-xs font-semibold
                      transition-all select-none
                      ${isAvailable
                        ? "border-green-500 bg-green-50 text-green-800 hover:shadow-xl hover:scale-110"
                        : table.status === "reserved"
                        ? "border-blue-500 bg-blue-50 text-blue-800"
                        : table.status === "occupied"
                        ? "border-red-500 bg-red-50 text-red-800"
                        : "border-gray-400 bg-gray-50 text-gray-700"}
                    `}
                  >
                    <div className="text-center">
                      <div className="font-bold">{table.table_number}</div>
                      <div>{table.capacity}p</div>
                      {isOutOfBounds && <div className="text-[10px] text-orange-600">Ngoài vùng</div>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Chú thích + Tên khu vực (nếu có) */}
        <div className="mt-6 flex justify-center">
          <div className="bg-white/95 backdrop-blur p-4 rounded-xl shadow-xl border">
            <h4 className="font-bold text-sm mb-2">Chú thích</h4>
            <div className="flex flex-wrap gap-4 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-50 border border-green-500 rounded"></div>
                <span>Còn trống</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-50 border border-blue-500 rounded"></div>
                <span>Đã đặt</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-50 border border-red-500 rounded"></div>
                <span>Đang dùng</span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2 italic">
              Hình dạng: <span className="font-medium capitalize">{areaShape}</span>
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}