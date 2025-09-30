# Chatbot HIWELL Restaurant - Enhanced with Vision, Speech-to-Text, Recommendations, and Improved Memory
# pip install gradio google-generativeai speechrecognition Pillow sqlite3

import gradio as gr
import datetime
import json
import google.generativeai as genai
import os
import speech_recognition as sr
from PIL import Image
import io
import uuid
import sqlite3
from contextlib import contextmanager

# Configure Gemini API
genai.configure(
    api_key=os.getenv("GOOGLE_API_KEY", "AIzaSyCeLmzAGwB1Pq - Z7TdkTNA4bZ00JfKlAsI")
)
model = genai.GenerativeModel("gemini-1.5-flash")

# Restaurant Info
RESTAURANT_NAME = "HIWELL"
ADDRESS = "54 Nguyễn Lương Bằng, Liên Chiểu, Đà Nẵng"
OPEN_HOURS = "8:00 - 22:00"
PHONE = "0123456789"
EMAIL = "info@hiwell.com"
PROMOTIONS = "Giảm 10% cho nhóm trên 5 người, giảm 20% đồ uống từ 20:00-22:00."
PAYMENTS = "Tiền mặt, thẻ tín dụng, chuyển khoản, ví điện tử (Momo, ZaloPay)."
SERVICES = "Bãi đỗ xe miễn phí, WiFi tốc độ cao, khu vui chơi trẻ em, phòng riêng, giao hàng qua GrabFood/ShopeeFood."
DIRECTIONS = "Từ trung tâm Đà Nẵng, đi Nguyễn Tất Thành đến Liên Chiểu, rẽ phải vào Nguyễn Lương Bằng, nhà hàng bên trái sau 500m."

MENU = [
    {
        "name": "Grilled Salmon",
        "price": 150000,
        "description": "Cá hồi nướng tươi với thảo mộc và sốt chanh, kèm rau củ hấp.",
        "ingredients": ["cá hồi", "thảo mộc", "chanh", "rau củ"],
        "tags": ["seafood", "grilled", "fish", "healthy"],
    },
    {
        "name": "Beef Steak",
        "price": 200000,
        "description": "Thịt bò Úc nướng tái/medium/well với sốt tiêu đen, kèm khoai tây nghiền.",
        "ingredients": ["thịt bò", "tiêu đen", "khoai tây"],
        "tags": ["meat", "steak", "beef"],
    },
    {
        "name": "Chicken Salad",
        "price": 100000,
        "description": "Salad gà nướng với rau tươi, cà chua, dưa leo và sốt mayonnaise nhẹ.",
        "ingredients": ["gà", "rau tươi", "cà chua", "dưa leo", "mayonnaise"],
        "tags": ["light", "salad", "chicken", "healthy"],
    },
    {
        "name": "Chocolate Cake",
        "price": 50000,
        "description": "Bánh chocolate tan chảy với lớp kem vani, trang trí trái cây tươi.",
        "ingredients": ["chocolate", "kem vani", "trái cây"],
        "tags": ["dessert", "cake", "chocolate", "sweet"],
    },
    {
        "name": "Fruit Juice",
        "price": 30000,
        "description": "Nước ép trái cây tươi hỗn hợp (cam, dứa, táo).",
        "ingredients": ["cam", "dứa", "táo"],
        "tags": ["drink", "juice", "fruit", "healthy"],
    },
]

TABLES = {
    "T1": {"capacity": 4, "location": "near_window", "features": "View đẹp ra biển"},
    "T2": {
        "capacity": 6,
        "location": "garden",
        "features": "Không gian xanh, thoáng đãng",
    },
    "T3": {
        "capacity": 10,
        "location": "vip_room",
        "features": "Phòng riêng, máy lạnh, karaoke",
    },
    "T4": {
        "capacity": 2,
        "location": "bar",
        "features": "Gần quầy bar, phù hợp cặp đôi",
    },
}

# SQLite Database Setup
DB_FILE = "hiwell_chatbot.db"


def init_db():
    with sqlite3.connect(DB_FILE) as conn:
        cursor = conn.cursor()
        cursor.execute(
            """
            CREATE TABLE IF NOT EXISTS reservations (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                phone TEXT NOT NULL,
                event TEXT,
                seats INTEGER,
                location TEXT,
                menu_selected TEXT,
                allergies TEXT,
                special_requests TEXT,
                time TEXT,
                table_id TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        )
        cursor.execute(
            """
            CREATE TABLE IF NOT EXISTS session_state (
                session_id TEXT PRIMARY KEY,
                step TEXT NOT NULL,
                data TEXT NOT NULL,
                last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        )
        cursor.execute(
            """
            CREATE TABLE IF NOT EXISTS conversation_history (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                session_id TEXT NOT NULL,
                role TEXT NOT NULL,
                content TEXT NOT NULL,
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (session_id) REFERENCES session_state(session_id)
            )
        """
        )
        conn.commit()


init_db()


# Context Manager for Database Connections
@contextmanager
def db_connection():
    conn = sqlite3.connect(DB_FILE)
    try:
        yield conn
    finally:
        conn.close()


# Database Operations
def save_reservation(phone, data):
    with db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(
            """
            INSERT INTO reservations (phone, event, seats, location, menu_selected, allergies, special_requests, time, table_id)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
            (
                phone,
                data.get("event", ""),
                data.get("seats"),
                data.get("location", ""),
                json.dumps(data.get("menu_selected", [])),
                json.dumps(data.get("allergies", [])),
                data.get("special_requests", ""),
                data.get("time", ""),
                data.get("table", ""),
            ),
        )
        conn.commit()


def update_reservation(phone, data):
    with db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(
            """
            UPDATE reservations SET
                event = ?, seats = ?, location = ?, menu_selected = ?,
                allergies = ?, special_requests = ?, time = ?, table_id = ?
            WHERE phone = ? AND id = (SELECT MAX(id) FROM reservations WHERE phone = ?)
        """,
            (
                data.get("event", ""),
                data.get("seats"),
                data.get("location", ""),
                json.dumps(data.get("menu_selected", [])),
                json.dumps(data.get("allergies", [])),
                data.get("special_requests", ""),
                data.get("time", ""),
                data.get("table", ""),
                phone,
                phone,
            ),
        )
        conn.commit()


def cancel_reservation(phone):
    with db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("DELETE FROM reservations WHERE phone = ?", (phone,))
        conn.commit()


def get_reservations(phone):
    with db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM reservations WHERE phone = ?", (phone,))
        rows = cursor.fetchall()
        return [
            {
                "id": row[0],
                "phone": row[1],
                "event": row[2],
                "seats": row[3],
                "location": row[4],
                "menu_selected": json.loads(row[5]) if row[5] else [],
                "allergies": json.loads(row[6]) if row[6] else [],
                "special_requests": row[7],
                "time": row[8],
                "table": row[9],
                "created_at": row[10],
            }
            for row in rows
        ]


def save_session_state(session_id, step, data):
    with db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(
            """
            INSERT OR REPLACE INTO session_state (session_id, step, data, last_updated)
            VALUES (?, ?, ?, ?)
        """,
            (session_id, step, json.dumps(data), datetime.datetime.now()),
        )
        conn.commit()


def get_session_state(session_id):
    with db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(
            "SELECT step, data FROM session_state WHERE session_id = ?", (session_id,)
        )
        row = cursor.fetchone()
        if row:
            return {"step": row[0], "data": json.loads(row[1])}
        return {"step": "none", "data": {}}


def save_conversation_history(session_id, role, content):
    with db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(
            """
            INSERT INTO conversation_history (session_id, role, content)
            VALUES (?, ?, ?)
        """,
            (session_id, role, content),
        )
        conn.commit()


def get_conversation_history(session_id):
    with db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(
            "SELECT role, content FROM conversation_history WHERE session_id = ? ORDER BY timestamp",
            (session_id,),
        )
        return [{"role": row[0], "content": row[1]} for row in cursor.fetchall()]


# Helper Functions
def format_reservation(info):
    return (
        f"📌 Đơn đặt bàn:\n"
        f"- Sự kiện: {info.get('event', 'N/A')}\n"
        f"- Số người: {info.get('seats', 'N/A')}\n"
        f"- Vị trí: {info.get('location', 'N/A')}\n"
        f"- Món đã chọn: {', '.join(info.get('menu_selected', [])) or 'N/A'}\n"
        f"- Dị ứng: {', '.join(info.get('allergies', [])) or 'N/A'}\n"
        f"- Yêu cầu đặc biệt: {info.get('special_requests', 'N/A')}\n"
        f"- Giờ: {info.get('time', 'N/A')}\n"
        f"- Bàn: {info.get('table', 'N/A')}\n"
        f"- Thời gian đặt: {info.get('created_at', 'N/A')}"
    )


def suggest_menu_based_on_history(history):
    if not history:
        return []
    tag_count = {}
    for res in history:
        for item in res.get("menu_selected", []):
            for m in MENU:
                if m["name"].lower() == item.lower():
                    for tag in m["tags"]:
                        tag_count[tag] = tag_count.get(tag, 0) + 1
    if not tag_count:
        return []
    top_tags = sorted(tag_count, key=tag_count.get, reverse=True)[:3]
    suggestions = set()
    for m in MENU:
        if any(t in m["tags"] for t in top_tags):
            suggestions.add(
                f"{m['name']} ({m['price']} VND) - {m['description'][:50]}..."
            )
    return list(suggestions)


def suggest_table(seats, preferences):
    available = [t for t, info in TABLES.items() if info["capacity"] >= seats]
    if preferences:
        available = [
            t
            for t in available
            if any(
                p.lower() in TABLES[t]["location"].lower()
                or p.lower() in TABLES[t]["features"].lower()
                for p in preferences
            )
        ]
    return available[0] if available else None


# Chatbot Logic
def process_input(message, audio, image, history, session_id):
    history = get_conversation_history(session_id) if not history else history
    history = [
        msg
        for msg in history
        if isinstance(msg, dict)
        and "role" in msg
        and "content" in msg
        and isinstance(msg["role"], str)
        and isinstance(msg["content"], str)
    ]

    # Handle speech-to-text
    text_input = message
    if audio:
        recognizer = sr.Recognizer()
        with sr.AudioFile(audio) as source:
            audio_data = recognizer.record(source)
            try:
                text_input = recognizer.recognize_google(audio_data, language="vi-VN")
            except sr.UnknownValueError:
                history.append(
                    {
                        "role": "assistant",
                        "content": "Xin lỗi, tôi không hiểu giọng nói. Hãy thử lại hoặc nhập văn bản nhé!",
                    }
                )
                save_conversation_history(
                    session_id, "assistant", history[-1]["content"]
                )
                return history, "", None, None
            except sr.RequestError:
                history.append(
                    {
                        "role": "assistant",
                        "content": "Lỗi kết nối dịch vụ nhận diện giọng nói. Hãy thử lại sau!",
                    }
                )
                save_conversation_history(
                    session_id, "assistant", history[-1]["content"]
                )
                return history, "", None, None

    # Add user input to history
    user_content = text_input if text_input else "[Hình ảnh]"
    history.append({"role": "user", "content": user_content})
    save_conversation_history(session_id, "user", user_content)

    # Handle image
    if image:
        message = (
            {"text": text_input, "files": [image]} if text_input else {"files": [image]}
        )
    else:
        message = text_input

    # Process the input
    history_updated, text_output, _, _ = chatbot_response(message, history, session_id)
    return history_updated, text_output, None, None


def chatbot_response(message, history, session_id):
    history = [
        msg
        for msg in history
        if isinstance(msg, dict)
        and "role" in msg
        and "content" in msg
        and isinstance(msg["role"], str)
        and isinstance(msg["content"], str)
    ]

    # Load session state
    state = get_session_state(session_id)
    step = state["step"]
    data = state["data"]

    # Prepare history for Gemini
    gemini_history = [
        {
            "role": "user" if msg["role"] == "user" else "model",
            "parts": [msg["content"]],
        }
        for msg in history[-10:]  # Limit to last 10 messages to avoid token overflow
    ]

    # Handle multimodal input
    image_part = None
    text_message = message
    if isinstance(message, dict) and "files" in message and message["files"]:
        image_path = message["files"][0]
        with open(image_path, "rb") as f:
            image_data = f.read()
        image_part = {"mime_type": "image/jpeg", "data": image_data}
        text_message = message.get("text", "")

    # System prompt
    system_prompt = f"""You are a friendly, engaging chatbot for {RESTAURANT_NAME} restaurant. Respond in natural, lively Vietnamese, making conversations personalized and fun. Avoid robotic language. Use conversation history and session data to maintain context and ensure logical responses. If the user refers to previous topics (e.g., 'change my booking' or 'that cake'), use history to respond consistently. Start every response with **Khách**: <user input>.

Restaurant info:
- Address: {ADDRESS}
- Open hours: {OPEN_HOURS}
- Phone: {PHONE}
- Email: {EMAIL}
- Promotions: {PROMOTIONS}
- Payments: {PAYMENTS}
- Services: {SERVICES}
- Directions: {DIRECTIONS}
- Menu: {json.dumps(MENU, ensure_ascii=False)}
- Tables: {json.dumps(TABLES, ensure_ascii=False)}

Current reservations (phone-based, from DB): {json.dumps({phone: get_reservations(phone) for phone in get_reservations('')}, ensure_ascii=False)}
Current state step: {step}
Current session data: {json.dumps(data, ensure_ascii=False)}
Conversation history (last 10): {json.dumps(gemini_history, ensure_ascii=False)}

Handle ALL customer queries comprehensively, referencing history for context:
1. Check/Edit/Cancel Reservation:
   - Ask for phone if unknown.
   - Show history/details, offer edit, cancel, or add orders.
   - Confirm actions, reference prior bookings (e.g., 'You booked for 4 last time').
2. Book Table:
   - Gather: event (suggest extras, e.g., birthday cake), seats, location/preferences (use suggest_table), menu_selected (use suggest_menu_based_on_history), allergies, special_requests, time, phone.
   - Apply promotions (e.g., group discount).
   - Confirm details before saving, reference past preferences.
3. Menu/Food Queries:
   - Describe dishes, prices, ingredients, estimated calories, availability.
   - Suggest based on preferences, history, or image analysis (e.g., 'You liked Grilled Salmon before').
   - Handle dine-in/takeaway/delivery orders.
4. Restaurant Services:
   - Answer about payments, promotions, services, directions, events, hours.
   - Handle special requests (catering, dietary needs, private events).
5. Vision AI:
   - If image ([image] in message), recognize dish, suggest similar from MENU.
6. General Queries:
   - Answer reviews, staff, hygiene, etc., relate to services, offer booking if relevant.
   - Clarify politely if unclear, referencing history if needed (e.g., 'You asked about WiFi earlier, did you mean...').

Personalize responses using history (e.g., 'Dựa trên lần trước bạn thích món nướng...'). Ask for phone at end of booking/check if missing.

Output JSON:
{{
  "response": "string starting with **Khách**: <user input>",
  "next_step": "none" or "gather_event" or "gather_seats" or ...,
  "data_updates": {{}},
  "reservation_action": "none" or "save" or "update" or "cancel" or "check"
}}
"""

    # Send to Gemini
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
        output = json.loads(output_text)
    except json.JSONDecodeError:
        history.append(
            {
                "role": "assistant",
                "content": f"**Khách**: {text_message}\nXin lỗi, có lỗi trong xử lý. Hãy thử lại!",
            }
        )
        save_conversation_history(session_id, "assistant", history[-1]["content"])
        return history, "", None, None
    except Exception as e:
        print(f"Gemini error: {e}")
        history.append(
            {
                "role": "assistant",
                "content": f"**Khách**: {text_message}\nXin lỗi, có lỗi xảy ra. Hãy thử lại nhé!",
            }
        )
        save_conversation_history(session_id, "assistant", history[-1]["content"])
        return history, "", None, None

    # Process output
    resp = output.get(
        "response",
        f"**Khách**: {text_message}\nXin lỗi, tôi không hiểu. Bạn có thể hỏi về đặt bàn, menu, hoặc dịch vụ không?",
    )
    next_step = output.get("next_step", "none")
    updates = output.get("data_updates", {})
    action = output.get("reservation_action", "none")

    # Update session state
    data.update(updates)
    save_session_state(session_id, next_step, data)

    # Handle reservation actions
    phone = data.get("phone")
    if phone:
        reservations = get_reservations(phone)
        if action == "save":
            if "table" not in data:
                data["table"] = suggest_table(
                    data.get("seats", 0), data.get("location", "").split()
                )
            save_reservation(phone, data)
            resp += "\nĐơn của bạn đã được lưu! " + format_reservation(data)
        elif action == "update" and reservations:
            update_reservation(phone, data)
            resp += "\nĐơn đã cập nhật! " + format_reservation(
                get_reservations(phone)[-1]
            )
        elif action == "cancel":
            cancel_reservation(phone)
            resp += "\nĐơn đã hủy thành công."
        elif action == "check":
            if reservations:
                resp += "\nLịch sử đơn:\n" + "\n\n".join(
                    [format_reservation(r) for r in reservations]
                )
                suggestions = suggest_menu_based_on_history(reservations)
                if suggestions:
                    resp += f"\nGợi ý dựa trên lịch sử: {', '.join(suggestions)}"
            else:
                resp += "\nKhông tìm thấy đơn nào với số điện thoại này."
    else:
        if action != "none":
            resp += "\nVui lòng cung cấp số điện thoại để xác nhận."

    if next_step == "none":
        data = {}
        save_session_state(session_id, next_step, data)

    # Append assistant response to history
    history.append({"role": "assistant", "content": resp})
    save_conversation_history(session_id, "assistant", resp)
    return history, "", None, None


# Gradio UI
def create_ui():
    with gr.Blocks(title=f"{RESTAURANT_NAME} Chatbot") as demo:
        gr.Markdown(f"# Chatbot {RESTAURANT_NAME} - Đặt Bàn, Tư Vấn & Gợi Ý")
        gr.Markdown(
            f"Xin chào! Tôi hỗ trợ đặt bàn, tư vấn menu, dịch vụ, và hơn thế nữa.\n📍 Địa chỉ: {ADDRESS}\nGửi hình ảnh để gợi ý món, hoặc nói để tương tác!"
        )

        session_id = gr.State(value=str(uuid.uuid4()))
        chatbot = gr.Chatbot(height=400, type="messages")
        msg = gr.Textbox(placeholder="Nhập tin nhắn...", label="Bạn:")
        audio = gr.Audio(
            sources=["microphone"], type="filepath", label="Nói để đặt bàn"
        )
        image = gr.Image(type="filepath", label="Gửi hình món ăn")
        clear = gr.Button("Xóa chat")

        def handle_submit(msg, audio, image, history, sess_id):
            return process_input(msg, audio, image, history, sess_id)

        msg.submit(
            handle_submit,
            [msg, audio, image, chatbot, session_id],
            [chatbot, msg, audio, image],
        )
        audio.upload(
            handle_submit,
            [msg, audio, image, chatbot, session_id],
            [chatbot, msg, audio, image],
        )
        image.upload(
            handle_submit,
            [msg, audio, image, chatbot, session_id],
            [chatbot, msg, audio, image],
        )

        def clear_chat():
            new_sess = str(uuid.uuid4())
            return None, "", None, None, new_sess

        clear.click(
            clear_chat, None, [chatbot, msg, audio, image, session_id], queue=False
        )

    return demo


if __name__ == "__main__":
    demo = create_ui()
    demo.launch(server_name="0.0.0.0", server_port=7860)
