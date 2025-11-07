"use client";

import React, { useState } from "react";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Users,
  MapPin,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Star,
  CheckCircle,
  Clock,
  XCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Table } from "@/services/tableService";

interface FloorMapProps {
  floorId: string;
  selectedTableId: string | null;
  onTableSelect: (tableId: string) => void;
  showSidebar?: boolean;
  tables: Table[]; // Tables passed from parent
}

const statusConfig: Record<
  "available" | "reserved" | "occupied" | "vip" | "cleaning",
  {
    bg: string;
    border: string;
    icon: React.ComponentType<{ className?: string }>;
    label: string;
    glow: string;
  }
> = {
  available: {
    bg: "bg-gradient-to-br from-green-400 to-green-600",
    border: "border-green-700",
    icon: CheckCircle,
    label: "Còn trống",
    glow: "shadow-green-500/50",
  },
  reserved: {
    bg: "bg-gradient-to-br from-yellow-400 to-yellow-600",
    border: "border-yellow-700",
    icon: Clock,
    label: "Đã đặt",
    glow: "shadow-yellow-500/50",
  },
  cleaning: {
    bg: "bg-gradient-to-br from-blue-400 to-blue-600",
    border: "border-blue-700",
    icon: Clock,
    label: "Đang dọn",
    glow: "shadow-blue-500/50",
  },
  occupied: {
    bg: "bg-gradient-to-br from-red-400 to-red-600",
    border: "border-red-700",
    icon: XCircle,
    label: "Đang dùng",
    glow: "shadow-red-500/50",
  },
  vip: {
    bg: "bg-gradient-to-br from-yellow-300 via-yellow-400 to-yellow-600",
    border: "border-yellow-800 border-2",
    icon: Star,
    label: "VIP",
    glow: "shadow-yellow-400/70 shadow-2xl",
  },
};

export default function FloorMap({
  floorId,
  selectedTableId,
  onTableSelect,
  showSidebar = true,
  tables,
}: FloorMapProps) {
  const [hoveredTable, setHoveredTable] = useState<string | null>(null);

  const getFloorNumberFromId = (id: string) => {
    if (!id) return undefined;
    const matched = id.match(/(\d+)/);
    return matched ? parseInt(matched[1], 10) : undefined;
  };

  // Filter tables by floor and map to display format
  const displayTables = tables
    .filter((table) => {
      const tableFloor = table.location?.floor ?? (table as any)?.floorNumber;
      const targetFloor = getFloorNumberFromId(floorId);
      return targetFloor === undefined || tableFloor === targetFloor;
    })
    .map((table, index) => {
      const amenities = Array.isArray((table as any)?.amenities)
        ? (table as any).amenities
        : [];
      const isVIP = amenities.some((amenity: string) =>
        amenity?.toLowerCase().includes("vip")
      );

      const fallbackX = 120 + (index % 6) * 120;
      const fallbackY = 100 + Math.floor(index / 6) * 120;

      return {
        id: table.id,
        name: table.table_number,
        capacity: table.capacity,
        status: table.status ?? "available",
        isVIP,
        x: table.location?.coordinates?.x ?? fallbackX,
        y: table.location?.coordinates?.y ?? fallbackY,
        floor_name:
          table.location?.area ||
          `Tầng ${table.location?.floor ?? getFloorNumberFromId(floorId) ?? 1}`,
        area: table.location?.area,
      };
    });

  const selectedTable = displayTables.find((t) => t.id === selectedTableId);

  return (
    <div className="relative w-full">
      <div className="w-full h-[600px] border-2 border-accent/20 rounded-lg overflow-hidden bg-gradient-to-br from-cream-50 to-cream-100 relative shadow-lg">
        <TransformWrapper
          initialScale={1}
          minScale={0.3}
          maxScale={3}
          wheel={{ step: 0.1 }}
          doubleClick={{ disabled: true }}
          panning={{ disabled: false }}
        >
          {({ zoomIn, zoomOut, resetTransform }) => (
            <>
              {/* Zoom Controls */}
              <div className="absolute top-4 right-4 z-20 flex flex-col gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => zoomIn()}
                  className="bg-background/95 backdrop-blur-sm border-accent/20 hover:bg-accent/10 hover:border-accent shadow-md"
                >
                  <ZoomIn className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => zoomOut()}
                  className="bg-background/95 backdrop-blur-sm border-accent/20 hover:bg-accent/10 hover:border-accent shadow-md"
                >
                  <ZoomOut className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => resetTransform()}
                  className="bg-background/95 backdrop-blur-sm border-accent/20 hover:bg-accent/10 hover:border-accent shadow-md"
                >
                  <RotateCcw className="h-4 w-4" />
                </Button>
              </div>

              <TransformComponent
                wrapperClass="w-full h-full"
                contentClass="w-full h-full relative"
              >
                {/* Floor Background Pattern */}
                <div
                  className="absolute inset-0 opacity-20 z-0"
                  style={{
                    backgroundImage:
                      "radial-gradient(circle, #d4af37 1px, transparent 1px)",
                    backgroundSize: "30px 30px",
                  }}
                />

                {/* Decorative Elements */}
                <svg
                  width="800"
                  height="600"
                  className="absolute inset-0 opacity-10 z-0"
                >
                  <defs>
                    <pattern
                      id={`grid-${floorId}`}
                      width="40"
                      height="40"
                      patternUnits="userSpaceOnUse"
                    >
                      <path
                        d="M 40 0 L 0 0 0 40"
                        fill="none"
                        stroke="#d4af37"
                        strokeWidth="0.5"
                      />
                    </pattern>
                  </defs>
                  <rect
                    width="100%"
                    height="100%"
                    fill={`url(#grid-${floorId})`}
                  />
                </svg>

                {/* Tables Container */}
                <div
                  className="relative w-full h-full"
                  style={{ minWidth: "800px", minHeight: "600px" }}
                >
                  {displayTables.length > 0 ? (
                    displayTables.map((table, index) => {
                      const isSelected = table.id === selectedTableId;
                      const isHovered = hoveredTable === table.id;
                      const tableStatus = table.isVIP ? "vip" : table.status;
                      const status =
                        statusConfig[tableStatus] || statusConfig.available;
                      const StatusIcon = status.icon;
                      const size = table.isVIP
                        ? table.capacity * 18 + 60
                        : table.capacity * 15 + 50;

                      return (
                        <motion.div
                          key={table.id}
                          className={cn(
                            "absolute cursor-pointer rounded-full border-2 flex flex-col items-center justify-center text-white font-semibold transition-all duration-300",
                            status.bg,
                            status.border,
                            isSelected &&
                              "ring-4 ring-accent ring-offset-4 scale-110 z-30",
                            isHovered && !isSelected && "scale-105 z-20",
                            table.isVIP && status.glow,
                            !isSelected && !isHovered && "hover:scale-105"
                          )}
                          style={{
                            left: `${table.x}px`,
                            top: `${table.y}px`,
                            width: `${size}px`,
                            height: `${size}px`,
                          }}
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{
                            scale: isSelected ? 1.1 : isHovered ? 1.05 : 1,
                            opacity: 1,
                          }}
                          transition={{
                            type: "spring",
                            stiffness: 300,
                            delay: index * 0.05,
                          }}
                          whileHover={{
                            scale: isSelected ? 1.1 : 1.05,
                          }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => onTableSelect(table.id)}
                          onMouseEnter={() => setHoveredTable(table.id)}
                          onMouseLeave={() => setHoveredTable(null)}
                        >
                          {/* VIP Crown Badge */}
                          {table.isVIP && (
                            <motion.div
                              initial={{ scale: 0, rotate: -180 }}
                              animate={{ scale: 1, rotate: 0 }}
                              className="absolute -top-2 -right-2"
                            >
                              <Star className="h-6 w-6 text-yellow-300 fill-yellow-300 drop-shadow-lg" />
                            </motion.div>
                          )}

                          {/* Table Content */}
                          <div className="text-center px-2">
                            <div className="flex items-center justify-center gap-1 mb-1">
                              <StatusIcon className="h-3 w-3" />
                              <div className="text-xs font-bold">
                                {table.name}
                              </div>
                            </div>
                            <div className="flex items-center justify-center gap-1 text-xs">
                              <Users className="h-3 w-3" />
                              <span>{table.capacity}</span>
                            </div>
                          </div>

                          {/* Animated Glow Effect for VIP */}
                          {table.isVIP && (
                            <motion.div
                              className="absolute inset-0 rounded-full bg-gradient-to-br from-yellow-300/50 to-yellow-600/50 blur-xl -z-10"
                              animate={{
                                scale: [1, 1.2, 1],
                                opacity: [0.5, 0.8, 0.5],
                              }}
                              transition={{
                                duration: 2,
                                repeat: Infinity,
                                ease: "easeInOut",
                              }}
                            />
                          )}

                          {/* Tooltip */}
                          <AnimatePresence>
                            {isHovered && (
                              <motion.div
                                initial={{ opacity: 0, y: -10, scale: 0.9 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: -10, scale: 0.9 }}
                                className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-3 z-40"
                              >
                                <Card className="bg-primary text-primary-foreground border-2 border-accent/50 shadow-xl min-w-[180px]">
                                  <CardContent className="p-3">
                                    <div className="flex items-center justify-between mb-2">
                                      <div className="font-bold text-base">
                                        {table.name}
                                      </div>
                                      {table.isVIP && (
                                        <Badge className="bg-gradient-gold text-primary-foreground border-0">
                                          <Star className="h-3 w-3 mr-1" />
                                          VIP
                                        </Badge>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-2 text-sm mb-1">
                                      <Users className="h-3 w-3" />
                                      <span>{table.capacity} người</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                      <MapPin className="h-3 w-3" />
                                      <span>{table.floor_name}</span>
                                    </div>
                                    <Badge
                                      className={cn(
                                        "mt-2 text-xs",
                                        status.bg,
                                        "text-white border-0"
                                      )}
                                    >
                                      {status.label}
                                    </Badge>
                                  </CardContent>
                                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-primary"></div>
                                </Card>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </motion.div>
                      );
                    })
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center z-10">
                      <p className="text-muted-foreground">
                        Không có bàn nào ở tầng này
                      </p>
                    </div>
                  )}
                </div>
              </TransformComponent>
            </>
          )}
        </TransformWrapper>

        {/* Legend Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute bottom-4 left-4 bg-background/95 backdrop-blur-sm p-4 rounded-lg border-2 border-accent/20 shadow-xl z-10"
        >
          <div className="text-sm font-bold mb-3 text-primary flex items-center gap-2">
            <MapPin className="h-4 w-4 text-accent" />
            Chú Thích
          </div>
          <div className="grid grid-cols-2 gap-3 text-xs">
            {Object.entries(statusConfig).map(([key, config]) => {
              const Icon = config.icon;
              return (
                <div key={key} className="flex items-center gap-2">
                  <div
                    className={cn(
                      "w-5 h-5 rounded-full border-2 flex items-center justify-center",
                      config.bg,
                      config.border
                    )}
                  >
                    <Icon className="h-3 w-3 text-white" />
                  </div>
                  <span className="font-medium">{config.label}</span>
                </div>
              );
            })}
          </div>
        </motion.div>
      </div>

      {/* Sidebar - Selected Table Info */}
      {showSidebar && selectedTable && (
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          className="mt-4"
        >
          <Card className="border-2 border-accent/30 bg-gradient-to-br from-card to-card/80 shadow-xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-xl text-primary">
                  {selectedTable.name}
                </h3>
                {selectedTable.isVIP && (
                  <Badge className="bg-gradient-gold text-primary-foreground border-0">
                    <Star className="h-4 w-4 mr-1" />
                    VIP
                  </Badge>
                )}
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <Users className="h-4 w-4 text-accent" />
                  <span className="text-muted-foreground">Sức chứa:</span>
                  <span className="font-semibold">
                    {selectedTable.capacity} người
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-accent" />
                  <span className="text-muted-foreground">Vị trí:</span>
                  <span className="font-semibold">
                    {selectedTable.floor_name}
                  </span>
                </div>
                <Badge
                  className={cn(
                    "w-fit",
                    statusConfig[
                      selectedTable.isVIP ? "vip" : selectedTable.status
                    ].bg,
                    "text-white border-0"
                  )}
                >
                  {React.createElement(
                    statusConfig[
                      selectedTable.isVIP ? "vip" : selectedTable.status
                    ].icon,
                    { className: "h-3 w-3 mr-1" }
                  )}
                  {
                    statusConfig[
                      selectedTable.isVIP ? "vip" : selectedTable.status
                    ].label
                  }
                </Badge>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}
