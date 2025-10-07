use restaurant_db;

SELECT CONCAT('ALTER TABLE ingredients DROP INDEX ', INDEX_NAME, ';')
FROM INFORMATION_SCHEMA.STATISTICS
WHERE TABLE_SCHEMA = 'restaurant_db'
  AND TABLE_NAME = 'ingredients'
  AND INDEX_NAME NOT IN ('PRIMARY', 'barcode', 'rfid');


INSERT INTO ingredients (id, name, unit, barcode, rfid, min_stock_level, current_stock)
VALUES
(UUID(), 'Tôm sú', 'kg', '8938505970013', 'RFID-TOM-001', 5, 12),
(UUID(), 'Rau muống', 'bó', '8938505970014', 'RFID-RAU-001', 20, 50),
(UUID(), 'Hành lá', 'kg', '8938505970015', 'RFID-HANH-001', 3, 8),
(UUID(), 'Tỏi', 'kg', '8938505970016', 'RFID-TOI-001', 2, 5),
(UUID(), 'Nước mắm', 'lít', '8938505970017', 'RFID-NUOCMAM-001', 10, 40),
(UUID(), 'Gạo', 'kg', '8938505970018', 'RFID-GAO-001', 50, 200),
(UUID(), 'Đường', 'kg', '8938505970019', 'RFID-DUONG-001', 20, 60),
(UUID(), 'Muối', 'kg', '8938505970020', 'RFID-MUOI-001', 15, 45),
(UUID(), 'Ớt', 'kg', '8938505970021', 'RFID-OT-001', 5, 15),
(UUID(), 'Tiêu đen', 'kg', '8938505970022', 'RFID-TIEU-001', 3, 10),
(UUID(), 'Nấm rơm', 'kg', '8938505970023', 'RFID-NAMROM-001', 8, 25),
(UUID(), 'Cà chua', 'kg', '8938505970024', 'RFID-CACHUA-001', 12, 35),
(UUID(), 'Khoai tây', 'kg', '8938505970025', 'RFID-KHOAITAY-001', 20, 70),
(UUID(), 'Cà rốt', 'kg', '8938505970026', 'RFID-CAROT-001', 15, 55),
(UUID(), 'Dầu ăn', 'lít', '8938505970027', 'RFID-DAUAN-001', 10, 30),
(UUID(), 'Bột ngọt', 'kg', '8938505970028', 'RFID-BOTNGOT-001', 8, 20),
(UUID(), 'Sữa đặc', 'lon', '8938505970029', 'RFID-SUA-001', 12, 40),
(UUID(), 'Bánh tráng', 'xấp', '8938505970030', 'RFID-BANHTRANG-001', 5, 18);

