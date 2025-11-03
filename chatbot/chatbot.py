# Chatbot HIWELL Restaurant - Enhanced with Vision, Recommendations, and Improved Memory
# pip install gradio google-generativeai Pillow requests uuid python-magic

import gradio as gr
import datetime
import json
import google.generativeai as genai
import os
from PIL import Image
import io
import uuid
import requests
import logging
import magic  # For MIME type detection

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s",
    handlers=[logging.FileHandler("chatbot.log"), logging.StreamHandler()],
)
logger = logging.getLogger(__name__)

# Configure Gemini API (securely)
genai.configure(api_key="AIzaSyDNHlqLN8GbMgYaSiyBJR052cfe5ESMKjU")
model = genai.GenerativeModel("gemini-2.5-flash")

BE_URL = os.getenv("BE_URL", "http://localhost:8000/api")  # Configurable backend URL

# Restaurant Info
RESTAURANT_NAME = "HIWELL"
ADDRESS = "54 Nguyễn Lương Bằng, Liên Chiểu, Đà Nẵng"
OPEN_HOURS = "7:00 - 23:00"
PHONE = "0123456789"
EMAIL = "info@hiwell.com"
PROMOTIONS = "Giảm 10% cho nhóm trên 5 người, giảm 20% đồ uống từ 20:00-23:00."
PAYMENTS = "Tiền mặt, thẻ tín dụng, chuyển khoản, ví điện tử (Momo, ZaloPay)."
SERVICES = "Bãi đỗ xe miễn phí, WiFi tốc độ cao, khu vui chơi trẻ em, phòng riêng, karaoke, các hoạt động vui chơi, chỉ phục vụ tại chỗ (không ship)."
DIRECTIONS = "Từ trung tâm Đà Nẵng, đi Nguyễn Tất Thành đến Liên Chiểu, rẽ phải vào Nguyễn Lương Bằng, nhà hàng bên trái sau 500m."


def format_reservation(info):
    """Format reservation info for display"""
    if isinstance(info, dict):
        table_info = info.get("table", {})
        table_name = (
            table_info.get("table_number", "N/A")
            if isinstance(table_info, dict)
            else str(table_info)
        )
        event_info = info.get("event", {})
        event_name = (
            event_info.get("name", "N/A")
            if isinstance(event_info, dict)
            else str(event_info) if event_info else "Không"
        )

        return (
            f"📅 **Thời gian:** {info.get('reservation_time', 'N/A')}\n"
            f"👥 **Số người:** {info.get('num_people', 'N/A')}\n"
            f"⏰ **Thời lượng:** {info.get('duration_minutes', 120)} phút\n"
            f"🍽️ **Bàn:** {table_name}\n"
            f"🎉 **Sự kiện:** {event_name}\n"
            f"📝 **Ghi chú:** {info.get('preferences', {}).get('notes', 'Không có') if isinstance(info.get('preferences'), dict) else 'Không có'}\n"
            f"📊 **Trạng thái:** {info.get('status', 'N/A')}"
        )
    return str(info)


def format_reservations_list(reservations):
    """Format list of reservations"""
    if not reservations:
        return "Bạn chưa có đặt bàn nào."
    # Ensure reservations is a list
    if not isinstance(reservations, list):
        reservations = []
    formatted = []
    for res in reservations[:10]:  # Show max 10
        res_id = res.get("id", "") if isinstance(res, dict) else ""
        res_id_str = str(res_id) if res_id else ""
        res_id_short = res_id_str[:8] if res_id_str else "N/A"
        table_info = res.get("table", {}) if isinstance(res, dict) else {}
        table_name = (
            table_info.get("table_number", "N/A")
            if isinstance(table_info, dict)
            else "N/A"
        )
        formatted.append(
            f"• {res.get('reservation_time', 'N/A')} - Bàn {table_name} - {res.get('num_people', 'N/A')} người - [{res_id_short}](http://localhost:3000/reservations/{res_id_str})"
        )
    return "\n".join(formatted)


def format_order_info(order):
    """Format order info for display"""
    if isinstance(order, dict):
        items = order.get("items", [])
        # Ensure items is a list
        if not isinstance(items, list):
            items = []
        items_text = "\n".join(
            [
                f"  • {item.get('dish', {}).get('name', 'N/A') if isinstance(item.get('dish'), dict) else 'N/A'} x{item.get('quantity', 0)} - {int(float(item.get('price', 0) or 0)):,}đ"
                for item in items[:10]
            ]
        )
        order_id = order.get("id", "")
        order_id_str = str(order_id)[:8] if order_id else "N/A"

        # Safely convert amounts to numbers for formatting
        final_amount = order.get("final_amount") or order.get("total_amount") or 0
        try:
            final_amount_num = int(float(final_amount))
        except (ValueError, TypeError):
            final_amount_num = 0

        return (
            f"📦 **Mã đơn:** {order_id_str}\n"
            f"🍽️ **Bàn:** {order.get('table', {}).get('table_number', 'N/A') if isinstance(order.get('table'), dict) else 'N/A'}\n"
            f"📊 **Trạng thái:** {order.get('status', 'N/A')}\n"
            f"💰 **Tổng tiền:** {final_amount_num:,}đ\n"
            f"📋 **Món ăn:**\n{items_text if items else '  Chưa có món'}"
        )
    return str(order)


def format_orders_list(orders):
    """Format list of orders"""
    if not orders:
        return "Bạn chưa có đơn hàng nào."
    # Ensure orders is a list
    if not isinstance(orders, list):
        orders = []
    formatted = []
    for order in orders[:10]:  # Show max 10
        order_id = order.get("id", "") if isinstance(order, dict) else ""
        order_id_str = str(order_id) if order_id else ""
        order_id_short = order_id_str[:8] if order_id_str else "N/A"
        # Safely convert amount to number for formatting
        order_amount = order.get("final_amount") or order.get("total_amount") or 0
        try:
            order_amount_num = int(float(order_amount))
        except (ValueError, TypeError):
            order_amount_num = 0

        formatted.append(
            f"• {order.get('created_at', 'N/A')} - {order.get('status', 'N/A')} - {order_amount_num:,}đ - [{order_id_short}](http://localhost:3000/orders/{order_id_str})"
        )
    return "\n".join(formatted)


def format_vouchers_list(vouchers):
    """Format list of vouchers"""
    if not vouchers:
        return "Hiện tại không có voucher nào đang áp dụng."
    # Ensure vouchers is a list
    if not isinstance(vouchers, list):
        vouchers = []
    formatted = []
    for voucher in vouchers[:5]:  # Show max 5
        if isinstance(voucher, dict):
            formatted.append(
                f"• **{voucher.get('code', 'N/A')}** - Giảm {voucher.get('discount_percent', voucher.get('discount_amount', 0))}% - {voucher.get('description', 'N/A')}"
            )
    return "\n".join(formatted)


def format_reservation_info(reservation):
    """Format single reservation info for display"""
    return format_reservation(reservation)


def suggest_menu_based_on_history(history, menu):
    if not history:
        return []
    tag_count = {}
    for res in history:
        for item in res.get("menu_selected", []):
            for m in menu:
                if m["name"].lower() == item.lower():
                    for tag in m.get("tags", []):
                        tag_count[tag] = tag_count.get(tag, 0) + 1
    if not tag_count:
        return []
    top_tags = sorted(tag_count, key=tag_count.get, reverse=True)[:3]
    suggestions = set()
    for m in menu:
        if any(t in m.get("tags", []) for t in top_tags):
            suggestions.add(
                f"{m['name']} ({m['price']} VND) - {m['description'][:50]}..."
            )
    return list(suggestions)


def suggest_table(seats, preferences, tables):
    try:
        seats = int(seats)  # Validate seats
        if seats < 1:
            raise ValueError("Số người phải lớn hơn 0")
        available = [t for t in tables if t["capacity"] >= seats]
        if preferences:
            available = [
                t
                for t in available
                if any(
                    p.lower() in t["location"].lower()
                    or p.lower() in t.get("features", "").lower()
                    for p in preferences
                )
            ]
        return available[0]["id"] if available else None
    except Exception as e:
        logger.error(f"Error suggesting table: {str(e)}")
        return None


def get_image_mime_type(image_path):
    try:
        mime = magic.Magic(mime=True)
        return mime.from_file(image_path)
    except Exception as e:
        logger.error(f"Error detecting image MIME type: {str(e)}")
        return "image/jpeg"  # Fallback


# Chatbot Logic
def process_input(message, image, history, session_id, user_id="UUID1", token=None):
    if not session_id:
        try:
            resp = requests.post(
                f"{BE_URL}/chat/sessions",
                json={"user_id": user_id, "channel": "web", "context": {}},
                timeout=5,
            )
            resp.raise_for_status()
            session_id = resp.json()["id"]
        except Exception as e:
            logger.error(f"Error creating session: {str(e)}")
            return history or [], "Lỗi khởi tạo chat, thử lại sau!", None, session_id

    user_content = message if message else "[Hình ảnh]"
    if not history:
        history = []
    history.append({"role": "user", "content": user_content})

    try:
        resp = requests.post(
            f"{BE_URL}/chat/messages",
            json={
                "session_id": session_id,
                "sender_type": "user",
                "message_text": user_content,
            },
            timeout=5,
        )
        resp.raise_for_status()
    except Exception as e:
        logger.error(f"Error saving user message: {str(e)}")

    if image:
        message = {"text": message, "files": [image]} if message else {"files": [image]}
    else:
        message = message

    # Import API helpers
    from api_helpers import (
        fetch_menu,
        fetch_tables,
        fetch_reservations,
        fetch_orders,
        fetch_vouchers,
        fetch_events,
    )

    # Fetch data from APIs with token if available
    menu = fetch_menu(token)
    tables = fetch_tables(token)
    reservations = (
        fetch_reservations(user_id, token)
        if user_id and user_id != "anonymous" and token
        else []
    )
    orders = (
        fetch_orders(user_id, token)
        if user_id and user_id != "anonymous" and token
        else []
    )
    vouchers = fetch_vouchers(token)
    events = fetch_events(token)
    history_updated, text_output, _, _ = chatbot_response(
        message,
        history,
        session_id,
        menu,
        tables,
        reservations,
        orders,
        vouchers,
        events,
        user_id,
        token,
    )

    try:
        if text_output and isinstance(text_output, str) and text_output.strip():
            resp = requests.post(
                f"{BE_URL}/chat/messages",
                json={
                    "session_id": session_id,
                    "sender_type": "bot",
                    "message_text": text_output,
                },
                timeout=5,
            )
            resp.raise_for_status()
        else:
            logger.warning("Skipping bot message save: Empty or invalid text_output")
    except Exception as e:
        logger.error(f"Error saving bot message: {str(e)}")

    return history_updated, text_output, None, session_id


def chatbot_response(
    message,
    history,
    session_id,
    menu,
    tables,
    reservations,
    orders=None,
    vouchers=None,
    events=None,
    user_id=None,
    token=None,
):
    history = [
        msg
        for msg in history
        if isinstance(msg, dict)
        and "role" in msg
        and "content" in msg
        and isinstance(msg["role"], str)
        and isinstance(msg["content"], str)
    ]

    state = {"step": "none", "data": {}}
    gemini_history = [
        {
            "role": "user" if msg["role"] == "user" else "model",
            "parts": [msg["content"]],
        }
        for msg in history[-10:]
    ]

    image_part = None
    text_message = message
    if isinstance(message, dict) and "files" in message and message["files"]:
        image_path = message["files"][0]
        mime_type = get_image_mime_type(image_path)
        with open(image_path, "rb") as f:
            image_data = f.read()
        image_part = {"mime_type": mime_type, "data": image_data}
        text_message = message.get("text", "")

    orders = orders or []
    vouchers = vouchers or []
    events = events or []

    # Ensure all data is list type before processing
    if not isinstance(menu, list):
        menu = []
    if not isinstance(tables, list):
        tables = []
    if not isinstance(reservations, list):
        reservations = []
    if not isinstance(orders, list):
        orders = []
    if not isinstance(vouchers, list):
        vouchers = []
    if not isinstance(events, list):
        events = []

    # Truncate menu to first 20 items for prompt
    menu_for_prompt = menu[:20] if isinstance(menu, list) and len(menu) > 0 else []

    system_prompt = f"""You are a friendly, engaging chatbot for {RESTAURANT_NAME} restaurant. Respond in natural, lively Vietnamese, making conversations personalized and fun. Avoid robotic language. Use conversation history and session data to maintain context and ensure logical responses.

**IMPORTANT**: Your response must ALWAYS be a valid JSON object with the following structure, even for simple or informal inputs. Do not return plain text. Wrap the conversational response in the "response" field.

Restaurant info:
- Address: {ADDRESS}
- Open hours: {OPEN_HOURS}
- Phone: {PHONE}
- Email: {EMAIL}
- Promotions: {PROMOTIONS}
- Payments: {PAYMENTS}
- Services: {SERVICES}
- Directions: {DIRECTIONS}

Available Data:
- Menu: {json.dumps(menu_for_prompt, ensure_ascii=False)} (showing first 20 items)
- Tables (available): {json.dumps(tables, ensure_ascii=False)}
- User Reservations: {json.dumps(reservations, ensure_ascii=False)}
- User Orders: {json.dumps(orders, ensure_ascii=False)}
- Active Vouchers: {json.dumps(vouchers, ensure_ascii=False)}
- Active Events: {json.dumps(events, ensure_ascii=False)}

Current state step: {state['step']}
Current session data: {json.dumps(state['data'], ensure_ascii=False)}
Conversation history (last 10): {json.dumps(gemini_history, ensure_ascii=False)}
User ID: {user_id or "anonymous"}

**Available API Endpoints** (use these in api_call when needed):
1. **Reservations** (requires auth token):
   - GET /reservations/:id - Get reservation by ID (customer can only see their own)
   - POST /reservations - Create reservation (requires: table_id, reservation_time ISO8601, num_people, optional: duration_minutes 30-480, event_id, pre_order_items[], preferences{{}})
   - PATCH /reservations/:id - Update reservation (customer can only update their own)
   - POST /reservations/:id/cancel - Cancel reservation (admin/employee only, requires: reason in body)
   - POST /reservations/:id/checkin - Check-in reservation
   - Note: Customer cannot list all reservations, must use ID to view specific one

2. **Orders** (requires auth token):
   - GET /orders/:id - Get order by ID (customer can only see their own)
   - POST /orders - Create order (requires: table_id)
   - PUT /orders/:id - Update order (customer can only update their own)
   - POST /orders/:id/items - Add item to order (requires: dish_id, quantity)
   - POST /orders/:id/support - Request support
   - POST /orders/:id/payment/request - Request payment
   - Note: Customer cannot list all orders, must use ID to view specific one

3. **Vouchers** (public):
   - GET /vouchers/active - Get active vouchers (no auth required)

4. **Dishes/Menu** (public):
   - GET /dishes - Get all dishes (no auth required)
   - GET /dishes/:id - Get dish by ID (no auth required)
   - GET /dishes/category/:id - Get dishes by category (no auth required)

5. **Tables** (public):
   - GET /tables - Get all tables (no auth required)
   - GET /tables/status/:status - Get tables by status (available, occupied, reserved)
   - GET /tables/:id - Get table by ID (no auth required)

6. **Events** (public):
   - GET /events - Get all events (no auth required)
   - GET /events/:id - Get event by ID (no auth required)

7. **Reviews** (requires auth, customer only):
   - POST /reviews - Create review (requires: type="dish"|"table", rating 1-5, dish_id or table_id, optional: order_id, order_item_id)
   - PUT /reviews/:id - Update review (customer can only update their own)

8. **Complaints/Feedback** (public, no auth required):
   - POST /complaints - Create complaint (requires: description, optional: order_id, order_item_id)

Handle ALL customer queries comprehensively with detailed context understanding:

1. **Reservation Flow** (8-step comprehensive process):
   When user wants to book a table, follow this detailed step-by-step flow:
   
   **Step 1 - Gather Table Selection:**
   - First, check available tables: GET /tables/status/available
   - Show available tables with details: table number, capacity, location, features
   - If user asks "bàn trống", "bàn nào còn trống", show all available tables
   - If user mentions number of people, filter tables by capacity (e.g., "4 người" -> show tables with capacity >= 4)
   - Suggest suitable tables based on party size: "Với [num_people] người, Hiwell đề xuất các bàn sau: ..."
   - Include links: [Xem bàn](http://localhost:3000/tables/:id)
   - Use "next_step": "gather_table"
   
   **Step 2 - Gather Number of People:**
   - Ask: "Bạn có bao nhiêu người tham gia ạ?" (1-50 people)
   - Validate: If user says more than 50, suggest booking multiple tables
   - Suggest table based on number: "Với [num] người, Hiwell đề xuất bàn có sức chứa [num+2] chỗ để thoải mái hơn"
   - Use "next_step": "gather_num_people"
   
   **Step 3 - Gather Reservation Time:**
   - Ask: "Bạn muốn đặt bàn vào thời gian nào ạ?"
   - Validate time format and convert to ISO8601
   - Check if time is within restaurant hours: {OPEN_HOURS}
   - If user says "hôm nay", "ngày mai", "tuần sau", convert to specific date
   - If time is outside hours or in the past, politely inform and suggest alternative times
   - Use "next_step": "gather_time"
   
   **Step 4 - Gather Duration:**
   - Ask: "Bạn dự định dùng bữa trong bao lâu ạ?" (30-480 minutes, default 120)
   - Suggest based on event type: "Nếu tham gia sự kiện, thời lượng thường là 180-240 phút"
   - Use "next_step": "gather_duration"
   
   **Step 5 - Check for Events:**
   - Check available events: GET /events (or use events data from context)
   - Show active events: Name, date, time, description, event fee
   - Ask: "Bạn có muốn tham gia sự kiện nào không ạ?"
   - If yes, show event details and link: [Xem sự kiện](http://localhost:3000/events/:id)
   - If event selected, note the event_id and event_fee
   - Use "next_step": "gather_event"
   
   **Step 6 - Gather Preferences & Special Requests:**
   - Ask: "Bạn có yêu cầu đặc biệt nào không ạ? (ví dụ: chỗ ngồi gần cửa sổ, không cay, ăn chay, dị ứng...)"
   - Store in preferences object: {{"dietary": "...", "seating": "...", "notes": "..."}}
   - Use "next_step": "gather_preferences"
   
   **Step 7 - Pre-order Dishes (Optional but recommended):**
   - Ask: "Bạn có muốn đặt trước món ăn không ạ?"
   - If yes, show menu categories and popular dishes
   - Suggest dishes based on: party size, dietary preferences, popular items, best sellers
   - Allow multiple selections with quantities
   - Show dish details: name, price, description, ingredients
   - Format: "Hiwell đề xuất các món phù hợp: [Tên món](http://localhost:3000/dishes/:id) - [price]đ"
   - Use "next_step": "gather_pre_order"
   - Store in pre_order_items: [{{"dish_id": "...", "quantity": 2}}, ...]
   
   **Step 8 - Confirmation & Creation:**
   - Display complete summary:
     * Bàn: [Tên bàn](http://localhost:3000/tables/:id) - capacity chỗ
     * Số người: num_people
     * Thời gian: reservation_time formatted
     * Thời lượng: duration phút
     * Sự kiện: event_name (if any) [Xem](http://localhost:3000/events/:id)
     * Món đặt trước: list of dishes with quantities
     * Yêu cầu đặc biệt: preferences
   - Ask: "Thông tin trên đã đúng chưa ạ? Hiwell sẽ tiến hành đặt bàn ngay nhé!"
   - If confirmed, call POST /reservations with all data
   - After creation, show reservation ID and link: "✅ Đã đặt bàn thành công! Mã đặt bàn: {id[:8]}. [Xem chi tiết](http://localhost:3000/reservations/:id)"
   - Use "next_step": "confirm_reservation"
   
   **Important for Reservation:**
   - Always validate table availability at requested time
   - Check if event is still active and has available slots
   - If table not available, suggest alternative times or tables
   - If user wants to modify reservation, use PATCH /reservations/:id

2. **Order Management & Inquiry**:
   **Check Order Details:**
   - When user asks "đơn hàng của tôi", "hóa đơn", "tra cứu đơn hàng":
     * If user provides order ID: GET /orders/:id
     * If no ID: "Để tra cứu đơn hàng, bạn vui lòng cung cấp mã đơn hàng hoặc [xem tại đây](http://localhost:3000/orders)"
   - Show complete order info:
     * Order ID (shortened): [id first 8 chars]
     * Status: pending/dining/paid/waiting_payment/cancelled
     * Table: [Bàn number](http://localhost:3000/tables/:id)
     * Items: List all dishes with quantity, price, subtotal
     * Voucher applied: [code] - discount [amount]đ (if any)
     * Total amount: [total_amount]đ
     * Final amount: [final_amount]đ (after discounts)
     * Created at: [formatted time]
     * Link: [Xem chi tiết](http://localhost:3000/orders/:id)
   
   **Create Order:**
   - POST /orders with table_id
   - Then add items: POST /orders/:id/items
   - Guide user through ordering process step by step
   
   **Add Items to Order:**
   - When user is dining and wants to add dishes:
     * GET /orders/:id to check current order
     * Show menu suggestions based on what they already ordered
     * POST /orders/:id/items with dish_id, quantity, optional special_instructions
     * Confirm: "✅ Đã thêm [dish_name] x[quantity] vào đơn hàng!"
   
   **Order Status Tracking:**
   - Explain statuses:
     * pending: Đang chờ xử lý
     * dining: Đang phục vụ
     * waiting_payment: Đang chờ thanh toán
     * paid: Đã thanh toán
     * cancelled: Đã hủy
   - Check order status: GET /orders/:id and show current status
   
   **Request Support:**
   - POST /orders/:id/support
   - Response: "✅ Đã gửi yêu cầu hỗ trợ! Nhân viên sẽ đến bàn của bạn ngay."
   
   **Request Payment:**
   - POST /orders/:id/payment/request
   - Show payment options: Tiền mặt, VNPay
   - Display invoice with breakdown

3. **Reservation Inquiry & Management**:
   **Check Reservation Details:**
   - When user asks "đặt bàn của tôi", "lịch đặt bàn":
     * If user provides reservation ID: GET /reservations/:id
     * If no ID: "Để tra cứu đặt bàn, bạn vui lòng cung cấp mã đặt bàn hoặc [xem tại đây](http://localhost:3000/reservations)"
   - Show complete reservation info:
     * Reservation ID: [id first 8 chars]
     * Status: pending/confirmed/cancelled/no_show
     * Table: [Bàn number](http://localhost:3000/tables/:id) - [capacity] chỗ
     * Time: [reservation_time formatted]
     * Duration: [duration_minutes] phút
     * Number of people: [num_people]
     * Event: [event_name if any] [Xem](http://localhost:3000/events/:id)
     * Pre-order items: [list if any]
     * Special requests: [preferences]
     * Link: [Xem chi tiết](http://localhost:3000/reservations/:id)
   
   **Check-in Reservation:**
   - When user arrives: POST /reservations/:id/checkin
   - Confirm: "✅ Check-in thành công! Chúc bạn có bữa ăn ngon miệng! 🍽️"
   - If reservation has pre-order items, mention: "Món đặt trước của bạn đã được chuẩn bị!"

4. **Event Inquiry & Information**:
   **Check Events:**
   - When user asks "sự kiện", "event", "chương trình":
     * GET /events (or use events data from context)
     * Show all active events with details:
       - Name, description
       - Start/end date and time
       - Event fee
       - Link: [Xem chi tiết](http://localhost:3000/events/:id)
     * Format beautifully: "🎉 **[event_name]**\n📅 [date_range]\n💰 Phí sự kiện: [fee]đ\n[description]"
   
   **Check Specific Event:**
   - GET /events/:id
   - Show full details, pricing, terms
   - If event is fully booked, inform user
   - If event requires reservation, guide user to book table with event

5. **Menu & Dish Inquiry** (Detailed):
   **View Menu:**
   - GET /dishes (or use menu data from context)
   - Categorize by dish type (appetizer, main course, dessert, beverage)
   - Show: name, price, description, ingredients, calories (if available)
   - Include images/links: [Xem món](http://localhost:3000/dishes/:id)
   - Format: "🍽️ **[dish_name]**\n💰 [price]đ\n📝 [description]\n🥘 [ingredients]"
   
   **Search Dish by Name:**
   - Search in menu data by name/keyword
   - Show matching dishes with details
   - Link to dish detail page
   
   **Get Dish Details:**
   - GET /dishes/:id
   - Show complete information:
     * Name, price, description
     * Ingredients/allergens
     * Calories, nutritional info (if available)
     * Best seller badge (if applicable)
     * Seasonal availability
     * Link: [Chi tiết](http://localhost:3000/dishes/:id)
   
   **Dish Suggestions:**
   - Based on context:
     * Party size: "Với [num] người, Hiwell đề xuất: [dishes]"
     * Dietary preferences: If vegetarian -> suggest veg dishes
     * Popular items: Suggest best sellers
     * Budget: Suggest dishes within price range
     * Occasion: Romantic dinner -> suggest romantic dishes
     * Time of day: Breakfast/lunch/dinner appropriate dishes
   - Format suggestions with reasons: "Hiwell đề xuất [dish_name] vì [reason]"

6. **Table Availability & Suggestions**:
   **Check Available Tables:**
   - GET /tables/status/available
   - Filter by criteria:
     * Capacity: Show tables that fit party size
     * Location: Window seats, private area, outdoor, etc.
     * Features: VIP, private room, wheelchair accessible
   - Format: "📋 **Bàn trống hiện tại:**\n[list of tables with details]"
   - Include links: [Xem bàn](http://localhost:3000/tables/:id)
   
   **Suggest Tables:**
   - Based on:
     * Number of people: "Với [num] người, Hiwell đề xuất:"
     * Occasion: Romantic -> private table
     * Group -> large table
     * Business -> quiet area
   - Explain why each table is suitable
   - Show table features and location
   
   **Check Table Details:**
   - GET /tables/:id
   - Show: table number, capacity, location, features, status
   - Link: [Chi tiết bàn](http://localhost:3000/tables/:id)

7. **Voucher Queries & Applications**:
   **List Active Vouchers:**
   - GET /vouchers/active
   - Show all available vouchers:
     * Code: **[code]**
     * Discount type: percentage/fixed amount
     * Discount value: [amount]
     * Validity: [start_date] to [end_date]
     * Minimum order: [min_order]đ (if any)
     * Terms and conditions
   - Format: "🎟️ **Voucher: [code]**\n💰 Giảm [discount]%\n📅 Áp dụng đến [end_date]\n💡 [terms]"
   - Link: [Xem voucher](http://localhost:3000/vouchers)
   
   **Apply Voucher to Order:**
   - When user asks to apply voucher:
     * Check if order exists
     * Verify voucher code is valid and active
     * Check if order meets minimum amount requirement
     * Apply voucher: POST /orders/:id/voucher with voucher_code
     * Confirm: "✅ Đã áp dụng voucher [code]! Giảm [amount]đ"

8. **Personal Information Inquiry**:
   **Check User Profile:**
   - When user asks about their account:
     * "Thông tin tài khoản của bạn:" (if authenticated)
     * Show: username, email, phone, full_name, points, ranking (if available)
     * If not authenticated: "Bạn cần đăng nhập để xem thông tin. [Đăng nhập](http://localhost:3000/login)"
   
   **Check User Orders:**
   - Direct user to order page: [Xem đơn hàng của tôi](http://localhost:3000/orders)
   - Or ask for specific order ID to check
   
   **Check User Reservations:**
   - Direct user to reservation page: [Xem đặt bàn của tôi](http://localhost:3000/reservations)
   - Or ask for specific reservation ID to check
   
   **Check User Points/Ranking:**
   - If available: Show user's loyalty points, current ranking tier
   - Explain benefits of each tier

9. **Restaurant Information (Comprehensive)**:
   **Address & Location:**
   - Always mention: {ADDRESS}
   - Provide directions: {DIRECTIONS}
   - If user asks "địa chỉ", "ở đâu", "đường nào":
     * Give full address
     * Mention nearby landmarks
     * Provide map link if available
   
   **Operating Hours:**
   - Always mention: {OPEN_HOURS}
   - If user asks "mấy giờ mở", "mấy giờ đóng", "giờ hoạt động":
     * Provide detailed hours for each day
     * Mention special hours for holidays/events
     * Remind about last order time
   
   **Contact Information:**
   - Phone: {PHONE}
   - Email: {EMAIL}
   - When user asks "liên hệ", "số điện thoại", "email"
   
   **Services & Amenities:**
   - List: {SERVICES}
   - Include: WiFi, parking, wheelchair accessible, private rooms, event hosting, etc.
   
   **Promotions & Special Offers:**
   - Show: {PROMOTIONS}
   - Mention daily/weekly/monthly specials
   - Event-based promotions
   - Loyalty program benefits

10. **Review & Feedback Management**:
    **Create Review:**
    - When user wants to review:
      * Ask: dish or table review?
      * Ask: rating (1-5 stars)
      * Ask: comment/feedback
      * POST /reviews with: type, rating, dish_id/table_id, comment, optional order_id
      * Thank: "✅ Cảm ơn bạn đã đánh giá! Ý kiến của bạn rất quan trọng với chúng tôi. ⭐"
    
    **Create Complaint:**
    - POST /complaints with description, optional order_id/reservation_id
    - Response: "✅ Đã ghi nhận phản ánh của bạn! Chúng tôi sẽ xử lý sớm nhất có thể."
    
    **View Reviews:**
    - GET /reviews/:id to show specific review
    - Format review nicely with rating stars, comment, date

11. **Smart Recommendations**:
    **Suggest Dishes:**
    - Based on:
      * Time of day (breakfast/lunch/dinner)
      * Party size
      * Budget range
      * Dietary restrictions
      * Popularity (best sellers)
      * Seasonal availability
      * Previous orders (if user has order history)
    - Format: "🍽️ Hiwell đề xuất cho bạn:\n[list with reasons]"
    
    **Suggest Tables:**
    - Based on:
      * Party size and preferences
      * Occasion (romantic, business, celebration)
      * Time of reservation
      * Special requirements (window, private, outdoor)
    - Format: "📋 Hiwell đề xuất bàn phù hợp:\n[list with reasons]"

12. **Payment & Billing Inquiries**:
    **Check Order Total:**
    - GET /orders/:id
   - Show breakdown:
     * Items subtotal: [amount]đ
     * Voucher discount: -[discount]đ (if any)
     * Event fee: +[fee]đ (if any)
     * Total: [total_amount]đ
     * Final amount: [final_amount]đ
    
    **Payment Methods:**
    - List: {PAYMENTS}
    - Explain each method (cash, card, VNPay, etc.)
    
    **Request Payment:**
    - POST /orders/:id/payment/request
    - Show payment options and redirect URL if online payment

13. **Special Requests & Customizations**:
    **Dietary Restrictions:**
    - When user mentions: vegetarian, vegan, halal, gluten-free, allergies
    - Filter menu to show suitable dishes
    - Note in preferences when booking/reserving
    
    **Seating Preferences:**
    - Window seat, quiet area, private room, outdoor, near entrance/exit
    - Note in preferences when booking
    
    **Customization Requests:**
    - Special cooking instructions (well done, spicy level, no onions, etc.)
    - Note in special_instructions when ordering

14. **Context Awareness & Follow-up**:
    - Remember previous conversation context
    - If user mentioned party size earlier, don't ask again
    - If user selected a table, remember it
    - If user is in the middle of booking, continue from where they left off
    - Use session data and conversation history to maintain context
    
    **Natural Conversation Flow:**
    - Greet warmly: "Chào bạn! 😊"
    - Use friendly, helpful tone
    - Ask one question at a time when gathering information
    - Confirm understanding: "Để Hiwell xác nhận lại: ..."
    - Thank users: "Cảm ơn bạn đã sử dụng dịch vụ của {RESTAURANT_NAME}! 🙏"

15. **Error Handling & Edge Cases**:
    **When Table Not Available:**
    - Suggest alternative times
    - Suggest alternative tables
    - Offer to join waiting list (if feature exists)
    
    **When Event Full:**
    - Inform user
    - Suggest similar upcoming events
    - Offer to be notified when slots open
    
    **When Dish Out of Stock:**
    - Apologize
    - Suggest similar dishes
    - Offer to notify when back in stock
    
    **When User Not Authenticated:**
    - Inform: "Bạn cần đăng nhập để thực hiện chức năng này. [Đăng nhập](http://localhost:3000/login)"
    - Still provide general information (menu, hours, address)
    
    **When Order/Reservation Not Found:**
    - Verify ID format
    - Ask user to double-check
    - Suggest checking order/reservation page

**Important Rules**:
- **ALWAYS show only user's own data** (reservations, orders) - APIs automatically filter by authenticated user
- **Customer cannot list all orders/reservations**: GET /orders and GET /reservations require admin/employee role. When user asks "đơn hàng của tôi" or "đặt bàn của tôi", ask them for specific ID or direct them to website: [Xem đơn hàng](http://localhost:3000/orders) or [Xem đặt bàn](http://localhost:3000/reservations)
- **Only use GET /orders/:id or GET /reservations/:id** when user provides specific ID
- **Always check context first**: Before making API calls, check if data is already available in menu/tables/reservations/orders/vouchers/events from context
- **Use available data smartly**: If menu/tables/events are already loaded, use them instead of making redundant API calls
- **Always use ISO8601 format for dates** (e.g., "2025-11-03T19:00:00.000Z")
- **Validate everything**: For reservations, ensure table_id exists in available tables, check time is within restaurant hours
- **Validate required fields before making API calls**: Don't call API if required fields are missing
- **Format responses beautifully**: Use emojis, line breaks, markdown formatting, and clickable links
- **Always include helpful links**: http://localhost:3000/tables/:id, http://localhost:3000/menu, http://localhost:3000/events/:id, http://localhost:3000/orders/:id, http://localhost:3000/reservations/:id
- **One question at a time**: When gathering data for reservation/order, ask one question at a time to avoid overwhelming user
- **Show confirmation summary**: Always display a summary before creating reservation/order for user to confirm
- **Authentication handling**: If user is not authenticated (no token), inform them to login first but still provide general info (menu, hours, address, events, vouchers)
- **Maintain conversation context**: Use session data and conversation history to remember previous answers and avoid asking same questions
- **Smart suggestions**: Always provide personalized suggestions based on party size, preferences, time, occasion, etc.
- **Error messages**: When API calls fail, provide friendly error messages and suggest alternatives
- **Natural language**: Respond naturally in Vietnamese, be friendly, helpful, and conversational
- **Complete information**: When showing order/reservation/event info, show all relevant details formatted nicely

**Output Format** (ALWAYS return JSON):
{{
  "response": "string - natural Vietnamese response to user",
  "next_step": "none" or "gather_table_id" or "gather_reservation_time" or "gather_num_people" or "gather_dish_selection" etc.,
  "data_updates": {{}} - store gathered data here,
  "reservation_action": "none" or "check" or "save" or "update" or "cancel",
  "order_action": "none" or "check" or "create" or "update",
  "api_call": {{ 
    "endpoint": "/reservations",
    "method": "POST" or "GET" or "PUT",
    "body": {{}} - request body for POST/PUT,
    "requires_auth": true/false
  }} or null
}}
"""

    content = [
        system_prompt
        + "\nUser message: "
        + (text_message if isinstance(text_message, str) else "")
    ]
    if image_part:
        content.append(image_part)

    chat = model.start_chat(history=gemini_history)
    try:
        gemini_response = chat.send_message(content)
        output_text = gemini_response.text.strip()
        if output_text.startswith("```json"):
            output_text = output_text[7:-3].strip()
        try:
            output = json.loads(output_text)
            # Validate required fields
            required = ["response", "next_step", "data_updates", "reservation_action"]
            if not all(k in output for k in required):
                logger.warning(
                    f"Gemini response missing required fields: {output_text}"
                )
                output = {
                    "response": f"Xin lỗi, tôi gặp vấn đề khi xử lý yêu cầu. Hãy thử lại nhé!",
                    "next_step": "none",
                    "data_updates": {},
                    "reservation_action": "none",
                    "api_call": None,
                }
            # Ensure response is a string, not a dict
            if isinstance(output.get("response"), dict):
                # If response is a dict, convert to string
                output["response"] = json.dumps(output["response"], ensure_ascii=False)
            elif not isinstance(output.get("response"), str):
                # If response is not string, convert to string
                output["response"] = str(output.get("response", ""))
        except json.JSONDecodeError:
            logger.warning(f"Gemini response is not valid JSON: {output_text}")
            output = {
                "response": f"{output_text}",
                "next_step": "none",
                "data_updates": {},
                "reservation_action": "none",
                "api_call": None,
            }
    except Exception as e:
        logger.error(f"Gemini error: {str(e)}")
        history.append(
            {
                "role": "assistant",
                "content": f"Xin lỗi, có lỗi xảy ra. Hãy thử lại nhé!",
            }
        )
        return history, "Xin lỗi, có lỗi xảy ra. Hãy thử lại nhé!", None, None

    # Extract response and ensure it's a string
    resp_raw = output.get(
        "response",
        f"Xin lỗi, tôi không hiểu. Bạn có thể hỏi về đặt bàn, menu, hoặc dịch vụ không?",
    )

    # Convert to string if it's not already
    if isinstance(resp_raw, dict):
        # If response is a dict (JSON object), try to extract the actual text
        # First check if there's a nested "response" field
        nested_resp = resp_raw.get("response")
        if nested_resp and isinstance(nested_resp, str):
            resp = nested_resp
        else:
            # If no nested response, just use the dict's string representation
            # But format it nicely - extract useful text if possible
            if "text" in resp_raw:
                resp = resp_raw["text"]
            elif "message" in resp_raw:
                resp = resp_raw["message"]
            else:
                # Last resort: use a default message instead of showing JSON
                resp = "Xin lỗi, có vấn đề khi xử lý phản hồi. Vui lòng thử lại!"
                logger.warning(
                    f"Response is a dict without text/message fields: {resp_raw}"
                )
    elif isinstance(resp_raw, str):
        # Check if resp_raw is a JSON string that needs parsing
        resp = resp_raw.strip()
        if resp.startswith("{") and resp.endswith("}"):
            try:
                parsed = json.loads(resp)
                if isinstance(parsed, dict):
                    # Try to extract text from parsed JSON
                    if "response" in parsed and isinstance(parsed["response"], str):
                        resp = parsed["response"]
                    elif "text" in parsed and isinstance(parsed["text"], str):
                        resp = parsed["text"]
                    elif "message" in parsed and isinstance(parsed["message"], str):
                        resp = parsed["message"]
                    # If can't extract, keep original (but log warning)
                    else:
                        logger.warning(
                            f"Response is JSON string but can't extract text: {resp[:100]}"
                        )
            except json.JSONDecodeError:
                # Not valid JSON, use as-is
                pass
    else:
        resp = str(resp_raw)

    next_step = output.get("next_step", "none")
    updates = output.get("data_updates", {})
    action = output.get("reservation_action", "none")
    api_call = output.get("api_call", None)

    state["data"].update(updates)
    state["step"] = next_step

    if api_call:
        try:
            from api_helpers import (
                create_reservation,
                create_order,
                get_reservation_by_id,
                get_order_by_id,
                cancel_reservation,
                create_review,
                create_complaint,
                fetch_orders,
                fetch_reservations,
                fetch_vouchers,
            )

            method = api_call.get("method", "") or ""
            if method:
                method = str(method).lower()
            endpoint = api_call.get("endpoint", "") or ""
            body = api_call.get("body", {}) or {}
            # Ensure body is a dict
            if not isinstance(body, dict):
                body = {}
            requires_auth = api_call.get("requires_auth", False)

            # Use token from function parameter (passed from socket/API request)
            # token is already available from function parameter, don't override it
            if requires_auth and not token:
                logger.warning(
                    f"API call requires auth but token is missing: {method} {endpoint}"
                )
            elif token:
                logger.debug(f"Using token for API call: {method} {endpoint}")

            # Add user_id to body if available and not already present
            if (
                user_id
                and user_id != "anonymous"
                and isinstance(body, dict)
                and "user_id" not in body
            ):
                body["user_id"] = user_id

            # Route to appropriate helper function based on endpoint
            if not endpoint:
                resp += "\n\n⚠️ Thiếu endpoint trong API call. Vui lòng thử lại!"
            elif endpoint.startswith("/reservations"):
                if method == "post":
                    result = create_reservation(body, token)
                    if result:
                        res_data = (
                            result.get("data", {})
                            if isinstance(result, dict)
                            else result
                        )
                        res_id = (
                            res_data.get("id", "") if isinstance(res_data, dict) else ""
                        )
                        res_id_str = str(res_id) if res_id else ""
                        res_id_short = res_id_str[:8] if res_id_str else "N/A"
                        resp += f"\n\n✅ **Đã tạo đặt bàn thành công!**\n📋 Mã đặt bàn: {res_id_short}\n🔗 [Xem chi tiết đặt bàn](http://localhost:3000/reservations/{res_id_str})"
                elif endpoint and "/cancel" in endpoint:
                    reservation_id = (
                        endpoint.split("/")[-2]
                        if endpoint.endswith("/cancel")
                        else endpoint.split("/")[-1]
                    )
                    # Cancel reservation requires reason in body
                    if isinstance(body, dict) and not body.get("reason"):
                        body["reason"] = "Hủy qua chatbot"
                    result = cancel_reservation(reservation_id, token)
                    if result:
                        resp += "\n\n✅ **Đã hủy đặt bàn thành công!**\nCảm ơn bạn đã thông báo."
                elif endpoint and "/checkin" in endpoint:
                    reservation_id = (
                        endpoint.split("/")[-2]
                        if endpoint.endswith("/checkin")
                        else endpoint.split("/")[-1]
                    )
                    from api_helpers import checkin_reservation

                    result = checkin_reservation(reservation_id, token)
                    if result:
                        resp += "\n\n✅ **Check-in thành công!**\nChúc bạn có bữa ăn ngon miệng! 🍽️"
                elif (
                    endpoint
                    and "/" in endpoint
                    and not endpoint.endswith("/reservations")
                ):
                    reservation_id = endpoint.split("/")[-1]
                    result = get_reservation_by_id(reservation_id, token)
                    if result:
                        formatted_res = format_reservation_info(result)
                        resp += f"\n\n📋 **Thông tin đặt bàn:**\n{formatted_res}\n🔗 [Xem chi tiết](http://localhost:3000/reservations/{reservation_id})"
                elif method == "patch":
                    reservation_id = endpoint.split("/")[-1]
                    from api_helpers import update_reservation

                    result = update_reservation(reservation_id, body, token)
                    if result:
                        resp += "\n\n✅ **Đã cập nhật đặt bàn thành công!**"
                else:
                    # GET reservation by ID (already handled above)
                    # Note: Customer cannot list all reservations via GET /reservations
                    resp += "\n\n⚠️ Để xem danh sách đặt bàn, vui lòng cung cấp mã đặt bàn hoặc truy cập: [Xem đặt bàn](http://localhost:3000/reservations)"
            elif endpoint.startswith("/orders"):
                if method == "post":
                    result = create_order(body, token)
                    if result:
                        order_data = (
                            result.get("data", {})
                            if isinstance(result, dict)
                            else result
                        )
                        order_id = (
                            order_data.get("id", "")
                            if isinstance(order_data, dict)
                            else ""
                        )
                        order_id_str = str(order_id) if order_id else ""
                        order_id_short = order_id_str[:8] if order_id_str else "N/A"
                        resp += f"\n\n✅ **Đã tạo đơn hàng thành công!**\n📦 Mã đơn: {order_id_short}\n🔗 [Xem chi tiết đơn hàng](http://localhost:3000/orders/{order_id_str})"
                elif (
                    endpoint
                    and isinstance(endpoint, str)
                    and "/" in endpoint
                    and not endpoint.endswith("/orders")
                    and "status" not in endpoint
                ):
                    order_id = endpoint.split("/")[-1].split("?")[0]
                    try:
                        result = get_order_by_id(order_id, token)
                        if result:
                            formatted_order = format_order_info(result)
                            resp += f"\n\n📦 **Thông tin đơn hàng:**\n{formatted_order}\n🔗 [Xem chi tiết](http://localhost:3000/orders/{order_id})"
                        else:
                            resp += f"\n\n⚠️ Không tìm thấy đơn hàng với mã: {order_id[:8] if order_id else 'N/A'}"
                    except Exception as e:
                        logger.error(f"Error getting order by ID: {str(e)}")
                        resp += f"\n\n⚠️ Lỗi khi tra cứu đơn hàng. Vui lòng thử lại sau!"
                elif endpoint and "/items" in endpoint and method == "post":
                    order_id = (
                        endpoint.split("/")[-2]
                        if endpoint.endswith("/items")
                        else endpoint.split("/")[-1]
                    )
                    from api_helpers import add_item_to_order

                    result = add_item_to_order(order_id, body, token)
                    if result:
                        resp += f"\n\n✅ **Đã thêm món vào đơn hàng!**"
                elif endpoint and "/support" in endpoint and method == "post":
                    order_id = (
                        endpoint.split("/")[-2]
                        if endpoint.endswith("/support")
                        else endpoint.split("/")[-1]
                    )
                    # Call support API
                    full_url = f"{BE_URL}{endpoint}"
                    headers = {"Authorization": f"Bearer {token}"}
                    resp_call = requests.post(full_url, headers=headers, timeout=10)
                    resp_call.raise_for_status()
                    resp += "\n\n✅ **Đã gửi yêu cầu hỗ trợ!**\nNhân viên sẽ liên hệ với bạn sớm nhất."
                elif endpoint and "/payment/request" in endpoint and method == "post":
                    order_id = (
                        endpoint.split("/")[-3]
                        if "/payment/request" in endpoint
                        else endpoint.split("/")[-1]
                    )
                    # Call payment request API
                    full_url = f"{BE_URL}{endpoint}"
                    headers = {"Authorization": f"Bearer {token}"}
                    resp_call = requests.post(full_url, headers=headers, timeout=10)
                    resp_call.raise_for_status()
                    result = resp_call.json()
                    redirect_url = (
                        result.get("data", {}).get("redirect_url")
                        if isinstance(result, dict)
                        else None
                    )
                    if redirect_url:
                        resp += f"\n\n💳 **Yêu cầu thanh toán:**\n🔗 [Thanh toán ngay]({redirect_url})"
                    else:
                        resp += "\n\n✅ **Đã gửi yêu cầu thanh toán!**"
                elif endpoint and method == "put":
                    order_id = endpoint.split("/")[-1]
                    from api_helpers import update_order

                    result = update_order(order_id, body, token)
                    if result:
                        resp += "\n\n✅ **Đã cập nhật đơn hàng thành công!**"
                else:
                    # GET order by ID (already handled above)
                    # Note: Customer cannot list all orders via GET /orders
                    resp += "\n\n⚠️ Để xem danh sách đơn hàng, vui lòng cung cấp mã đơn hoặc truy cập: [Xem đơn hàng](http://localhost:3000/orders)"
            elif endpoint and endpoint.startswith("/reviews") and method == "post":
                result = create_review(body, token)
                if result:
                    resp += "\n\n✅ **Cảm ơn bạn đã đánh giá!**\nÝ kiến của bạn rất quan trọng với chúng tôi. ⭐"
            elif endpoint and endpoint.startswith("/complaints") and method == "post":
                result = create_complaint(
                    body, token
                )  # No auth required for complaints
                if result:
                    resp += "\n\n✅ **Đã gửi phản hồi thành công!**\nChúng tôi sẽ xem xét và phản hồi sớm nhất có thể. Cảm ơn bạn!"
            elif endpoint and endpoint.startswith("/vouchers"):
                result = fetch_vouchers(token)
                if result:
                    formatted_vouchers = format_vouchers_list(result)
                    resp += f"\n\n🎟️ **Voucher đang áp dụng:**\n{formatted_vouchers}\n🔗 [Xem tất cả voucher](http://localhost:3000/vouchers)"
            elif endpoint:
                # Fallback: direct API call
                full_url = f"{BE_URL}{endpoint}"
                headers = {}
                if token:
                    headers["Authorization"] = f"Bearer {token}"
                resp_call = requests.request(
                    method.upper(),
                    full_url,
                    json=body if body else None,
                    headers=headers,
                    timeout=10,
                )
                resp_call.raise_for_status()
                result = resp_call.json()
                resp += f"\n✅ Thực hiện thành công!"
        except Exception as e:
            logger.error(f"API call error: {str(e)}")
            error_msg = str(e)
            if "401" in error_msg or "403" in error_msg:
                resp += "\n⚠️ Bạn cần đăng nhập để thực hiện thao tác này."
            elif "404" in error_msg:
                resp += "\n⚠️ Không tìm thấy thông tin. Vui lòng kiểm tra lại."
            elif "400" in error_msg or "422" in error_msg:
                resp += "\n⚠️ Thông tin không hợp lệ. Vui lòng kiểm tra lại các trường bắt buộc."
            else:
                resp += f"\n⚠️ Lỗi: {error_msg}. Vui lòng thử lại sau!"

    history.append({"role": "assistant", "content": resp})
    return history, resp, None, None


def get_conversation_history(session_id):
    try:
        resp = requests.get(f"{BE_URL}/chat/sessions/{session_id}/messages", timeout=5)
        resp.raise_for_status()
        messages = resp.json()
        return [
            {"role": msg["sender_type"], "content": msg["message_text"]}
            for msg in messages
        ]
    except Exception as e:
        logger.error(f"Error fetching history: {str(e)}")
        return []


# Gradio UI
def create_ui():
    with gr.Blocks(title=f"{RESTAURANT_NAME} Chatbot") as demo:
        gr.Markdown(f"# Chatbot {RESTAURANT_NAME} - Đặt Bàn, Tư Vấn & Gợi Ý")
        gr.Markdown(
            f"Xin chào! Tôi hỗ trợ đặt bàn, tư vấn menu, dịch vụ, và hơn thế nữa.\n📍 Địa chỉ: {ADDRESS}\nGửi hình ảnh để gợi ý món!"
        )

        session_id = gr.State(None)
        chatbot = gr.Chatbot(height=400, type="messages")
        msg = gr.Textbox(placeholder="Nhập tin nhắn...", label="Bạn:")
        image = gr.Image(type="filepath", label="Gửi hình món ăn")
        seats = gr.Number(label="Số người (đặt bàn)", value=1, minimum=1)
        date = gr.Textbox(
            label="Ngày đặt bàn (YYYY-MM-DD)", placeholder="VD: 2025-09-27"
        )
        time = gr.Textbox(label="Giờ đặt bàn (HH:MM)", placeholder="VD: 19:00")
        clear = gr.Button("Xóa chat")

        def handle_submit(msg, image, seats, date, time, history, sess_id):
            history_updated, text_output, _, new_sess_id = process_input(
                msg, image, history, sess_id
            )
            formatted_history = [
                {"role": msg["role"], "content": msg["content"]}
                for msg in history_updated
            ]
            return formatted_history, text_output, None, seats, date, time, new_sess_id

        msg.submit(
            handle_submit,
            [msg, image, seats, date, time, chatbot, session_id],
            [chatbot, msg, image, seats, date, time, session_id],
        )
        image.upload(
            handle_submit,
            [msg, image, seats, date, time, chatbot, session_id],
            [chatbot, msg, image, seats, date, time, session_id],
        )

        def clear_chat():
            return [], "", None, 1, "", "", None

        clear.click(
            clear_chat,
            None,
            [chatbot, msg, image, seats, date, time, session_id],
            queue=False,
        )

    return demo


if __name__ == "__main__":
    demo = create_ui()
    demo.launch(server_name="0.0.0.0", server_port=7860)
