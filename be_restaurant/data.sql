create database  restaurant_db;
use restaurant_db;
INSERT INTO users (id, username, email, password_hash, phone, full_name, role, created_at) VALUES
('789e0123-e89b-12d3-a456-426614174002', 'customer1', 'customer@example.com', '$2b$10$hash1', '0123456789', 'Nguyễn Văn A', 'customer', NOW()),
('789e0123-e89b-12d3-a456-426614174003', 'employee1', 'employee@restaurant.com', '$2b$10$hash2', '0987654321', 'Trần Thị B', 'employee', NOW()),
('789e0123-e89b-12d3-a456-426614174004', 'admin1', 'admin@restaurant.com', '$2b$10$hash3', '0369852147', 'Lê Văn C', 'admin', NOW());

INSERT INTO category_dishes (id, name) VALUES
('11111111-1111-1111-1111-111111111111', 'Món Nướng'),
('11111111-1111-1111-1111-111111111112', 'Món Lẩu'),
('11111111-1111-1111-1111-111111111113', 'Món Chiên'),
('11111111-1111-1111-1111-111111111114', 'Món Tráng Miệng'),
('11111111-1111-1111-1111-111111111115', 'Đồ Uống');

INSERT INTO ingredients (id, name, unit, min_stock_level, current_stock) VALUES
('22222222-2222-2222-2222-222222222222', 'Thịt Bò', 'kg', 10, 50),
('22222222-2222-2222-2222-222222222223', 'Thịt Gà', 'kg', 8, 40),
('22222222-2222-2222-2222-222222222224', 'Tôm Sú', 'kg', 5, 30),
('22222222-2222-2222-2222-222222222225', 'Khoai Tây', 'kg', 5, 20),
('22222222-2222-2222-2222-222222222226', 'Kem Vanilla', 'hộp', 2, 10);

INSERT INTO dishes (id, name, price, category_id, media_urls, is_best_seller) VALUES
('44444444-4444-4444-4444-444444444444', 'Bò Nướng BBQ', 150000, '11111111-1111-1111-1111-111111111111', '["https://img.com/bo1.jpg"]', TRUE),
('44444444-4444-4444-4444-444444444445', 'Lẩu Hải Sản', 350000, '11111111-1111-1111-1111-111111111112', '["https://img.com/lau1.jpg"]', TRUE),
('44444444-4444-4444-4444-444444444446', 'Gà Rán Giòn', 120000, '11111111-1111-1111-1111-111111111113', '["https://img.com/ga1.jpg"]', FALSE),
('44444444-4444-4444-4444-444444444447', 'Khoai Tây Chiên', 50000, '11111111-1111-1111-1111-111111111113', '["https://img.com/khoai1.jpg"]', FALSE),
('44444444-4444-4444-4444-444444444448', 'Kem Vanilla', 30000, '11111111-1111-1111-1111-111111111114', '["https://img.com/kem1.jpg"]', FALSE);

INSERT INTO dish_ingredients (dish_id, ingredient_id, quantity) VALUES
('44444444-4444-4444-4444-444444444444', '22222222-2222-2222-2222-222222222222', 0.3),
('44444444-4444-4444-4444-444444444445', '22222222-2222-2222-2222-222222222224', 0.5),
('44444444-4444-4444-4444-444444444446', '22222222-2222-2222-2222-222222222223', 0.4),
('44444444-4444-4444-4444-444444444447', '22222222-2222-2222-2222-222222222225', 0.2),
('44444444-4444-4444-4444-444444444448', '22222222-2222-2222-2222-222222222226', 1);

INSERT INTO tables (id, table_number, capacity, deposit, status) VALUES
('55555555-5555-5555-5555-555555555555', 'B01', 4, 100000, 'available'),
('55555555-5555-5555-5555-555555555556', 'B02', 4, 100000, 'occupied'),
('55555555-5555-5555-5555-555555555557', 'VIP01', 8, 200000, 'reserved');


INSERT INTO table_groups (id, group_name, table_ids, total_capacity, deposit, status) VALUES
('66666666-6666-6666-6666-666666666666', 'Gia Đình 1', '["55555555-5555-5555-5555-555555555555","55555555-5555-5555-5555-555555555556"]', 8, 150000, 'available');


INSERT INTO vouchers (id, code, discount_type, value, max_uses, min_order_value) VALUES
('77777777-7777-7777-7777-777777777777', 'SALE50', 'percentage', 50, 100, 200000),
('77777777-7777-7777-7777-777777777778', 'GIAM30K', 'fixed', 30000, 50, 100000);


INSERT INTO events (id, name, description, price, inclusions, decorations, created_at) VALUES
('99999999-0000-0000-0000-000000000001', 'Tiệc Sinh Nhật Trẻ Em',
 'Tổ chức sinh nhật với bánh kem và bong bóng',
 2500000,
 '["Bánh kem", "Trang trí bóng bay", "Nước ngọt"]',
 '["Backdrop Happy Birthday", "Bóng bay nhiều màu"]',
 NOW()),

('99999999-0000-0000-0000-000000000002', 'Tiệc Gia Đình BBQ',
 'BBQ ngoài trời cho nhóm 6-10 người',
 4500000,
 '["Menu thịt nướng", "Bếp than", "Nhân viên hỗ trợ"]',
 '["Đèn lồng", "Bàn gỗ", "Khăn trải bàn đỏ"]',
 NOW()),

('99999999-0000-0000-0000-000000000003', 'Tiệc Cầu Hôn Lãng Mạn',
 'Không gian riêng tư với hoa hồng và nến',
 6000000,
 '["Bữa tối 3 món", "Rượu vang", "Nhạc violin"]',
 '["Hoa hồng", "Nến lối đi", "Chữ Marry Me"]',
 NOW()),

('99999999-0000-0000-0000-000000000004', 'Họp Mặt Công Ty',
 'Tổ chức tiệc tổng kết cuối năm',
 8000000,
 '["MC", "Backdrop công ty", "Menu 7 món"]',
 '["Hoa tươi", "Âm thanh cơ bản"]',
 NOW());
