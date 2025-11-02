export interface MockTable {
  id: string;
  name: string;
  floor_id: string;
  floor_name: string;
  capacity: number;
  status: "available" | "reserved" | "occupied";
  isVIP: boolean;
  x?: number;
  y?: number;
  features?: string[];
}

export const mockTables: MockTable[] = [
  {
    id: "T-1",
    name: "Bàn 1",
    floor_id: "floor-1",
    floor_name: "Tầng 1",
    capacity: 4,
    status: "available",
    isVIP: false,
    x: 150,
    y: 100,
    features: ["Gần cửa sổ"],
  },
  {
    id: "T-2",
    name: "Bàn 2",
    floor_id: "floor-1",
    floor_name: "Tầng 1",
    capacity: 2,
    status: "reserved",
    isVIP: false,
    x: 300,
    y: 100,
  },
  {
    id: "T-3",
    name: "Bàn 3",
    floor_id: "floor-1",
    floor_name: "Tầng 1",
    capacity: 6,
    status: "available",
    isVIP: false,
    x: 450,
    y: 100,
    features: ["Khu yên tĩnh"],
  },
  {
    id: "T-4",
    name: "Bàn 4",
    floor_id: "floor-1",
    floor_name: "Tầng 1",
    capacity: 4,
    status: "available",
    isVIP: false,
    x: 150,
    y: 250,
  },
  {
    id: "T-5",
    name: "Bàn 5",
    floor_id: "floor-1",
    floor_name: "Tầng 1",
    capacity: 2,
    status: "occupied",
    isVIP: false,
    x: 300,
    y: 250,
  },
  {
    id: "T-6",
    name: "Bàn VIP 1",
    floor_id: "floor-1",
    floor_name: "Tầng 1",
    capacity: 8,
    status: "available",
    isVIP: true,
    x: 450,
    y: 250,
    features: ["VIP", "Khu riêng"],
  },
  {
    id: "T-7",
    name: "Bàn 7",
    floor_id: "floor-2",
    floor_name: "Tầng 2",
    capacity: 4,
    status: "available",
    isVIP: false,
    x: 200,
    y: 150,
  },
  {
    id: "T-8",
    name: "Bàn 8",
    floor_id: "floor-2",
    floor_name: "Tầng 2",
    capacity: 6,
    status: "available",
    isVIP: false,
    x: 400,
    y: 150,
  },
  {
    id: "T-9",
    name: "Bàn VIP 2",
    floor_id: "floor-2",
    floor_name: "Tầng 2",
    capacity: 2,
    status: "available",
    isVIP: true,
    x: 200,
    y: 300,
    features: ["VIP", "View đẹp"],
  },
  {
    id: "T-10",
    name: "Bàn 10",
    floor_id: "floor-2",
    floor_name: "Tầng 2",
    capacity: 8,
    status: "reserved",
    isVIP: false,
    x: 400,
    y: 300,
  },
];

export const getTableById = (id: string): MockTable | undefined => {
  return mockTables.find((table) => table.id === id);
};

export const getTablesByFloor = (floorId: string): MockTable[] => {
  return mockTables.filter((table) => table.floor_id === floorId);
};

export const getAvailableTables = (floorId?: string): MockTable[] => {
  let tables = mockTables.filter((table) => table.status === "available");
  if (floorId) {
    tables = tables.filter((table) => table.floor_id === floorId);
  }
  return tables;
};
