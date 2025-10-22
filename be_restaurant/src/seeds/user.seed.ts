//review: user, order, dish, order_item, table

//order: users reservations tables table_groups vouchers events

//2, 'pending', 30, NULL, '2025-10-05 10:30:00')	Error Code: 1452. Cannot add or update a child row: a foreign key constraint fails (`restaurant_db`.`order_items`, CONSTRAINT `order_items_ibfk_271` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE ON UPDATE CASCADE)	0.000 sec

//14:25:57	INSERT INTO reviews (id, user_id, order_id, dish_id, rating, comment, created_at, order_item_id, table_id, type) VALUES ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaa001', '11111111-1111-1111-1111-111111111001', '22222222-2222-2222-2222-222222222001', '11111111-1111-1111-1111-111111111001', 5, 'Phở bò rất ngon, nước dùng đậm đà và thịt mềm.', '2025-10-05 09:00:00', '33333333-3333-3333-3333-333333333001', NULL, 'dish'),  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaa002', '11111111-1111-1111-1111-111111111002', '22222222-2222-2222-2222-222222222002', '11111111-1111-1111-1111-111111111007', 4, 'Nem rán giòn và ngon, nhưng hơi nhiều dầu một chút.', '2025-10-05 09:05:00', '33333333-3333-3333-3333-333333333002', NULL, 'dish'),  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaa003', '11111111-1111-1111-1111-111111111003', '22222222-2222-2222-2222-222222222003', NULL, 5, 'Bàn số 5 rất sạch sẽ và thoáng mát, nhân viên phục vụ tốt.', '2025-10-05 09:10:00', NULL, '44444444-4444-4444-4444-444444444005', 'table'),  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaa004', '11111111-1111-1111-1111-111111111004', '22222222-2222-2222-2222-222222222004', '11111111-1111-1111-1111-111111111015', 3, 'Trái cây tươi nhưng hơi ít, mong lần sau nhiều hơn.', '2025-10-05 09:20:00', '33333333-3333-3333-3333-333333333004', NULL, 'dish'),  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaa005', '11111111-1111-1111-1111-111111111005', '22222222-2222-2222-2222-222222222005', NULL, 4, 'Bàn số 2 gần cửa sổ rất đẹp, nhưng hơi ồn vào giờ cao điểm.', '2025-10-05 09:30:00', NULL, '44444444-4444-4444-4444-444444444002', 'table')	Error Code: 1452. Cannot add or update a child row: a foreign key constraint fails (`restaurant_db`.`reviews`, CONSTRAINT `reviews_ibfk_644` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE)	0.000 sec

import User from "../models/User";

export async function seedUsers() {
  const count = await User.count();

  if (count === 0) {
    console.log("🌱 Seeding Users...");

    await User.bulkCreate([
      {
        username: "tranvanc",
        email: "tranvanc@example.com",
        password_hash: "$2b$10$examplehash101",
        role: "employee",
        full_name: "Trần Văn C",
        preferences: { theme: "light" },
        ranking: "regular",
        points: 200,
      },
      {
        username: "phamthid",
        email: "phamthid@example.com",
        password_hash: "$2b$10$examplehash102",
        role: "employee",
        full_name: "Phạm Thị D",
        preferences: { language: "vi" },
        ranking: "vip",
        points: 500,
      },
      {
        username: "nguyenvane",
        email: "nguyenvane@example.com",
        password_hash: "$2b$10$examplehash103",
        role: "employee",
        full_name: "Nguyễn Văn E",
        preferences: { notifications: true },
        ranking: "regular",
        points: 150,
      },
      {
        username: "ledinhf",
        email: "ledinhf@example.com",
        password_hash: "$2b$10$examplehash104",
        role: "employee",
        full_name: "Lê Đình F",
        preferences: { theme: "dark" },
        ranking: "platinum",
        points: 800,
      },
      {
        username: "doanthig",
        email: "doanthig@example.com",
        password_hash: "$2b$10$examplehash105",
        role: "employee",
        full_name: "Đoàn Thị G",
        preferences: { language: "en" },
        ranking: "regular",
        points: 100,
      },
    ]);

    console.log("✅ Users seeded successfully!");
  } else {
    console.log("✅ Users already exist, skipping seed.");
  }
}
