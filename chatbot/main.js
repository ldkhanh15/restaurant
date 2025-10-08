// server.js - Full Node.js Backend Code with Express and MySQL

import express from "express";
import mysql from "mysql2/promise";
import dotenv from "dotenv";
import { v4 as uuidv4 } from "uuid";
import bodyParser from "body-parser";

dotenv.config();

const app = express();
app.use(bodyParser.json({ limit: "50mb" }));
app.use(bodyParser.urlencoded({ extended: true, limit: "50mb" }));

// Kết nối MySQL pool (tối ưu cho nhiều kết nối concurrent)
const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "1503",
  database: process.env.DB_NAME || "restaurant_db",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Middleware để log request (tối ưu debug)
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url} - ${new Date().toISOString()}`);
  next();
});

// API 1: Tạo session chat mới (POST /api/chat/sessions)
// Body: { user_id, is_authenticated, channel, context }
// Return: { id, message }
app.post("/api/chat/sessions", async (req, res) => {
  const {
    user_id,
    is_authenticated = 0,
    channel = "web",
    context = {},
  } = req.body;
  if (!user_id) {
    return res.status(400).json({ error: "user_id is required" });
  }
  try {
    const sessionId = uuidv4(); // Sử dụng uuid từ thư viện để generate ID
    await pool.query(
      `INSERT INTO chat_sessions (id, user_id, is_authenticated, channel, context) 
       VALUES (?, ?, ?, ?, ?)`,
      [sessionId, user_id, is_authenticated, channel, JSON.stringify(context)]
    );
    res
      .status(201)
      .json({ id: sessionId, message: "Session created successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create session" });
  }
});

// API 2: Lưu message vào session (POST /api/chat/messages)
// Body: { session_id, sender_type, message_text }
// Return: { id, message }
app.post("/api/chat/messages", async (req, res) => {
  const { session_id, sender_type, message_text } = req.body;
  if (!session_id || !sender_type || !message_text) {
    return res.status(400).json({
      error: "Missing required fields",
      details: {
        session_id: session_id ? "Provided" : "Missing",
        sender_type: sender_type ? "Provided" : "Missing",
        message_text: message_text ? "Provided" : "Missing",
      },
    });
  }
  try {
    const messageId = uuidv4();
    await pool.query(
      `INSERT INTO chat_messages (id, session_id, sender_type, message_text) 
       VALUES (?, ?, ?, ?)`,
      [messageId, session_id, sender_type, message_text]
    );
    res
      .status(201)
      .json({ id: messageId, message: "Message saved successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to save message", sqlError: err.message });
  }
});

// API 3: Lấy tất cả messages của session (GET /api/chat/sessions/:id/messages)
// Params: id (session_id)
// Return: array of messages
app.get("/api/chat/sessions/:id/messages", async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await pool.query(
      `SELECT id, sender_type, message_text, timestamp 
       FROM chat_messages WHERE session_id = ? ORDER BY timestamp ASC`,
      [id]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch messages" });
  }
});

// API 4: Cập nhật session (e.g., kết thúc session) (PUT /api/chat/sessions/:id)
// Body: { status, handled_by }
// Return: { message }
app.put("/api/chat/sessions/:id", async (req, res) => {
  const { id } = req.params;
  const { status = "closed", handled_by = "bot" } = req.body;
  try {
    await pool.query(
      `UPDATE chat_sessions SET status = ?, handled_by = ?, end_time = CURRENT_TIMESTAMP 
       WHERE id = ?`,
      [status, handled_by, id]
    );
    res.json({ message: "Session updated successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update session" });
  }
});

// API 5: Lấy lịch sử sessions của user (GET /api/chat/users/:user_id/sessions)
// Params: user_id
// Return: array of sessions
app.get("/api/chat/users/:user_id/sessions", async (req, res) => {
  const { user_id } = req.params;
  try {
    const [rows] = await pool.query(
      `SELECT id, channel, start_time, end_time, status 
       FROM chat_sessions WHERE user_id = ? ORDER BY start_time DESC`,
      [user_id]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch user sessions" });
  }
});

// New APIs for Restaurant Features

// API: Get all dishes (GET /api/dishes)
app.get("/api/dishes", async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT d.id, d.name, d.description, d.price, c.name as category, d.media_urls, d.is_best_seller
       FROM dishes d JOIN category_dishes c ON d.category_id = c.id WHERE d.active = 1 AND d.deleted_at IS NULL`
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch dishes" });
  }
});

// API: Get dish details by ID (GET /api/dishes/:id)
app.get("/api/dishes/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await pool.query(
      `SELECT d.id, d.name, d.description, d.price, c.name as category, d.media_urls, d.is_best_seller
       FROM dishes d JOIN category_dishes c ON d.category_id = c.id WHERE d.id = ? AND d.active = 1 AND d.deleted_at IS NULL`,
      [id]
    );
    if (rows.length === 0)
      return res.status(404).json({ error: "Dish not found" });
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch dish" });
  }
});

// API: Get reviews for a dish (GET /api/dishes/:id/reviews)
app.get("/api/dishes/:id/reviews", async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await pool.query(
      `SELECT r.id, r.rating, r.comment, r.created_at, u.username
       FROM reviews r JOIN users u ON r.user_id = u.id WHERE r.dish_id = ? ORDER BY r.created_at DESC`,
      [id]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch reviews" });
  }
});

// API: Create review (POST /api/reviews)
// Body: { user_id, dish_id, rating, comment, order_id (optional) }
app.post("/api/reviews", async (req, res) => {
  const { user_id, dish_id, rating, comment, order_id } = req.body;
  if (!user_id || !dish_id || !rating)
    return res.status(400).json({ error: "Missing required fields" });
  try {
    const reviewId = uuidv4();
    await pool.query(
      `INSERT INTO reviews (id, user_id, order_id, dish_id, rating, comment) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [reviewId, user_id, order_id || null, dish_id, rating, comment || ""]
    );
    res
      .status(201)
      .json({ id: reviewId, message: "Review created successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create review" });
  }
});

// API: Get available tables (GET /api/tables/available)
// Query: ?seats=4&date=YYYY-MM-DD&time=HH:MM
app.get("/api/tables/available", async (req, res) => {
  const { seats, date, time } = req.query;
  try {
    let query = `
      SELECT t.id, t.table_number, t.capacity, t.location, t.status
      FROM tables t 
      WHERE t.capacity >= ? AND t.deleted_at IS NULL AND t.status = 'available'
    `;
    const queryParams = [seats || 1];

    if (date && time) {
      const reservationTime = `${date} ${time}:00`;
      query += `
        AND NOT EXISTS (
          SELECT 1 FROM reservations r 
          WHERE r.table_id = t.id AND r.reservation_time = ? AND r.status NOT IN ('cancelled', 'no_show')
        )`;
      queryParams.push(reservationTime);
    }

    const [rows] = await pool.query(query, queryParams);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch available tables" });
  }
});

// API: Create reservation (POST /api/reservations)
// Body: { user_id, table_id, reservation_time, duration_minutes, num_people, preferences, timeout_minutes }
app.post("/api/reservations", async (req, res) => {
  const {
    user_id,
    table_id,
    reservation_time,
    duration_minutes = 90,
    num_people,
    preferences = {},
    timeout_minutes = 15,
  } = req.body;
  if (!user_id || !table_id || !reservation_time || !num_people)
    return res.status(400).json({ error: "Missing required fields" });
  try {
    const reservationId = uuidv4();
    await pool.query(
      `INSERT INTO reservations (id, user_id, table_id, reservation_time, duration_minutes, num_people, preferences, timeout_minutes) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        reservationId,
        user_id,
        table_id,
        reservation_time,
        duration_minutes,
        num_people,
        JSON.stringify(preferences),
        timeout_minutes,
      ]
    );
    // Update table status to reserved
    await pool.query(`UPDATE tables SET status = 'reserved' WHERE id = ?`, [
      table_id,
    ]);
    res
      .status(201)
      .json({ id: reservationId, message: "Reservation created successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create reservation" });
  }
});

// API: Get user reservations (GET /api/users/:user_id/reservations)
app.get("/api/users/:user_id/reservations", async (req, res) => {
  const { user_id } = req.params;
  try {
    const [rows] = await pool.query(
      `SELECT r.id, r.reservation_time, r.num_people, r.status, t.table_number
       FROM reservations r JOIN tables t ON r.table_id = t.id WHERE r.user_id = ? ORDER BY r.reservation_time DESC`,
      [user_id]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch reservations" });
  }
});

// API: Update reservation (PUT /api/reservations/:id)
// Body: { status, reservation_time, num_people, etc. }
app.put("/api/reservations/:id", async (req, res) => {
  const { id } = req.params;
  const { status, reservation_time, num_people, preferences } = req.body;
  try {
    await pool.query(
      `UPDATE reservations SET status = ?, reservation_time = ?, num_people = ?, preferences = ?, updated_at = CURRENT_TIMESTAMP 
       WHERE id = ?`,
      [
        status || "pending",
        reservation_time,
        num_people,
        JSON.stringify(preferences || {}),
        id,
      ]
    );
    if (status === "cancelled") {
      const [resRows] = await pool.query(
        `SELECT table_id FROM reservations WHERE id = ?`,
        [id]
      );
      if (resRows.length > 0) {
        await pool.query(
          `UPDATE tables SET status = 'available' WHERE id = ?`,
          [resRows[0].table_id]
        );
      }
    }
    res.json({ message: "Reservation updated successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update reservation" });
  }
});

// API: Create order (POST /api/orders)
// Body: { user_id, reservation_id, table_id, items: [{dish_id, quantity, customizations}], voucher_id, notes, payment_method }
app.post("/api/orders", async (req, res) => {
  const {
    user_id,
    reservation_id,
    table_id,
    items,
    voucher_id,
    notes,
    payment_method,
  } = req.body;
  if (!user_id || !items || items.length === 0)
    return res.status(400).json({ error: "Missing required fields" });
  try {
    const orderId = uuidv4();
    let total_amount = 0;
    for (const item of items) {
      const [dishRows] = await pool.query(
        `SELECT price FROM dishes WHERE id = ?`,
        [item.dish_id]
      );
      if (dishRows.length === 0)
        return res
          .status(404)
          .json({ error: `Dish ${item.dish_id} not found` });
      total_amount += dishRows[0].price * item.quantity;
    }
    // Apply voucher if any (simplified)
    if (voucher_id) {
      const [vouRows] = await pool.query(
        `SELECT value, discount_type FROM vouchers WHERE id = ? AND active = 1`,
        [voucher_id]
      );
      if (vouRows.length > 0) {
        const { value, discount_type } = vouRows[0];
        total_amount =
          discount_type === "percentage"
            ? total_amount * (1 - value / 100)
            : total_amount - value;
      }
    }
    await pool.query(
      `INSERT INTO orders (id, user_id, reservation_id, table_id, voucher_id, total_amount, customizations, notes, payment_method) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        orderId,
        user_id,
        reservation_id || null,
        table_id || null,
        voucher_id || null,
        total_amount,
        JSON.stringify({}),
        notes || "",
        payment_method || "cash",
      ]
    );
    for (const item of items) {
      const itemId = uuidv4();
      await pool.query(
        `INSERT INTO order_items (id, order_id, dish_id, quantity, price, customizations) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          itemId,
          orderId,
          item.dish_id,
          item.quantity,
          (
            await pool.query(`SELECT price FROM dishes WHERE id = ?`, [
              item.dish_id,
            ])
          )[0][0].price,
          JSON.stringify(item.customizations || {}),
        ]
      );
    }
    res
      .status(201)
      .json({ id: orderId, message: "Order created successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create order" });
  }
});

// API: Get order status (GET /api/orders/:id/status)
app.get("/api/orders/:id/status", async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await pool.query(
      `SELECT o.status, o.total_amount, o.payment_status, oi.status as item_status
       FROM orders o LEFT JOIN order_items oi ON o.id = oi.order_id WHERE o.id = ?`,
      [id]
    );
    if (rows.length === 0)
      return res.status(404).json({ error: "Order not found" });
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch order status" });
  }
});

// API: Create complaint (POST /api/complaints)
// Body: { user_id, description, resolution_notes (optional) }
app.post("/api/complaints", async (req, res) => {
  const { user_id, description, resolution_notes } = req.body;
  if (!user_id || !description)
    return res.status(400).json({ error: "Missing required fields" });
  try {
    const complaintId = uuidv4();
    await pool.query(
      `INSERT INTO complaints (id, user_id, description, resolution_notes) 
       VALUES (?, ?, ?, ?)`,
      [complaintId, user_id, description, resolution_notes || ""]
    );
    res
      .status(201)
      .json({ id: complaintId, message: "Complaint created successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create complaint" });
  }
});

// API: Get directions (GET /api/directions)
// Static for now, can integrate with maps API later
app.get("/api/directions", async (req, res) => {
  res.json({
    directions:
      "Từ trung tâm Đà Nẵng, đi theo đường Nguyễn Tất Thành đến Liên Chiểu, rẽ phải vào Nguyễn Lương Bằng, nhà hàng bên trái sau 500m.",
  });
});

// Handle 404
app.use((req, res) => {
  res.status(404).json({ error: "Endpoint not found" });
});

// Khởi động server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
