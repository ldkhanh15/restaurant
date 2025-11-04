export interface MockEvent {
  id: string;
  title: string;
  description: string;
  image: string;
  date: string;
  time: string;
  location?: string;
  price?: number;
  featured?: boolean;
}

export const mockEvents: MockEvent[] = [
  {
    id: "event-1",
    title: "Đêm Nhạc Jazz Thứ 7",
    description:
      "Thưởng thức âm nhạc jazz sống động cùng menu đặc biệt và không gian lãng mạn",
    image: "/jazz-night-event.jpg",
    date: "2024-02-10",
    time: "19:00",
    location: "Tầng 2 - Khu VIP",
    price: 500000,
    featured: true,
  },
  {
    id: "event-2",
    title: "Valentine Special",
    description:
      "Menu đặc biệt cho cặp đôi với không gian lãng mạn, hoa hồng và champagne",
    image: "/valentine-event.jpg",
    date: "2024-02-14",
    time: "18:00",
    location: "Toàn nhà hàng",
    price: 800000,
    featured: true,
  },
  {
    id: "event-3",
    title: "Wine Tasting Evening",
    description: "Thưởng thức các loại rượu vang cao cấp cùng món ăn đặc biệt",
    image: "/wine-tasting-event.jpg",
    date: "2024-02-20",
    time: "19:30",
    location: "Phòng riêng Tầng 2",
    price: 1200000,
    featured: false,
  },
];

export const getEventById = (id: string): MockEvent | undefined => {
  return mockEvents.find((event) => event.id === id);
};

export const getFeaturedEvents = (): MockEvent[] => {
  return mockEvents.filter((event) => event.featured);
};
