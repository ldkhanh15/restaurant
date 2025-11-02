export interface MockReview {
  id: string;
  dish_id: string;
  customer_name: string;
  customer_avatar?: string;
  rating: number;
  comment: string;
  date: string;
  helpful_count?: number;
  verified?: boolean;
}

export const mockReviews: MockReview[] = [
  {
    id: "review-1",
    dish_id: "dish-1",
    customer_name: "Nguyễn Thị Lan",
    rating: 5,
    comment:
      "Cá hồi tươi ngon, nướng vừa tới! Vị rất đậm đà, gia vị đặc biệt rất hợp. Sẽ quay lại đặt món này lần sau.",
    date: "2024-01-15",
    helpful_count: 12,
    verified: true,
  },
  {
    id: "review-2",
    dish_id: "dish-1",
    customer_name: "Trần Văn Nam",
    rating: 4,
    comment:
      "Món ăn ngon, trình bày đẹp. Cá hồi tươi nhưng phần rau củ hơi ít. Nhìn chung rất hài lòng.",
    date: "2024-01-12",
    helpful_count: 8,
    verified: true,
  },
  {
    id: "review-3",
    dish_id: "dish-1",
    customer_name: "Lê Thị Hoa",
    rating: 5,
    comment:
      "Tuyệt vời! Sẽ quay lại. Món này đáng từng đồng, chất lượng cao cấp.",
    date: "2024-01-10",
    helpful_count: 15,
    verified: true,
  },
  {
    id: "review-4",
    dish_id: "dish-1",
    customer_name: "Phạm Minh Tuấn",
    rating: 5,
    comment:
      "Cá hồi Na Uy thật sự rất tươi, nướng hoàn hảo. Rau củ đi kèm cũng rất ngon. Highly recommend!",
    date: "2024-01-08",
    helpful_count: 20,
    verified: true,
  },
  {
    id: "review-5",
    dish_id: "dish-2",
    customer_name: "Trần Thị Mai",
    rating: 5,
    comment:
      "Thịt bò tuyệt hảo, nướng hoàn hảo! Wagyu Úc thật sự chất lượng cao. Đáng giá tiền.",
    date: "2024-01-13",
    helpful_count: 18,
    verified: true,
  },
  {
    id: "review-6",
    dish_id: "dish-2",
    customer_name: "Nguyễn Văn Đức",
    rating: 4,
    comment:
      "Thịt bò ngon, nhưng giá hơi cao. Phục vụ tốt, không gian sang trọng.",
    date: "2024-01-11",
    helpful_count: 5,
    verified: true,
  },
  {
    id: "review-7",
    dish_id: "dish-3",
    customer_name: "Hoàng Thị Nga",
    rating: 4,
    comment:
      "Salad Caesar tươi ngon, sốt đặc biệt. Bánh mì nướng giòn rất ngon.",
    date: "2024-01-14",
    helpful_count: 7,
    verified: true,
  },
  {
    id: "review-8",
    dish_id: "dish-5",
    customer_name: "Phạm Minh Tuấn",
    rating: 5,
    comment:
      "Bánh chocolate ngon, trang trí đẹp mắt. Độ ngọt vừa phải, rất hợp với khẩu vị.",
    date: "2024-01-11",
    helpful_count: 10,
    verified: true,
  },
];

export const getReviewsByDishId = (dishId: string): MockReview[] => {
  return mockReviews.filter((review) => review.dish_id === dishId);
};
