# Chatbot HIWELL Restaurant - Enhanced with Vision, Speech-to-Text, Recommendations, and Improved Memory
# pip install gradio google-generativeai speechrecognition Pillow sqlite3 requests uuid

import gradio as gr
import datetime
import json
import google.generativeai as genai
import os
import speech_recognition as sr
from PIL import Image
import io
import uuid
import requests

# Configure Gemini API
genai.configure(
    api_key=os.getenv("GOOGLE_API_KEY", "AIzaSyCeLmzAGwB1Pq - Z7TdkTNA4bZ00JfKlAsI")
)
model = genai.GenerativeModel("gemini-1.5-flash")

BE_URL = "http://localhost:3000/api/chat"  # Thay bằng URL production nếu cần

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
    # Tạo session mới nếu chưa có
    if not session_id:
        user_id = "UUID1"  # Giả sử lấy từ auth/user input, thay bằng logic thực (ví dụ: từ phone)
        try:
            resp = requests.post(
                f"{BE_URL}/sessions",
                json={
                    "user_id": user_id,
                    "channel": "web",
                    "context": {},  # Có thể thêm context từ reservation
                },
            )
            resp.raise_for_status()
            session_id = resp.json()["id"]
        except Exception as e:
            print(f"Error creating session: {e}")
            return (
                history or [],
                "Lỗi khởi tạo chat, thử lại sau!",
                None,
                None,
                session_id,
            )

    # Handle speech-to-text
    text_input = message
    if audio:
        recognizer = sr.Recognizer()
        with sr.AudioFile(audio) as source:
            audio_data = recognizer.record(source)
            try:
                text_input = recognizer.recognize_google(audio_data, language="vi-VN")
            except sr.UnknownValueError:
                return (
                    history or [],
                    "Xin lỗi, tôi không hiểu giọng nói. Hãy thử lại hoặc nhập văn bản nhé!",
                    None,
                    None,
                    session_id,
                )
            except sr.RequestError:
                return (
                    history or [],
                    "Lỗi kết nối dịch vụ nhận diện giọng nói. Hãy thử lại sau!",
                    None,
                    None,
                    session_id,
                )

    # Add user input to history
    user_content = text_input if text_input else "[Hình ảnh]"
    if not history:
        history = []
    history.append({"role": "user", "content": user_content})

    # Lưu user message lên BE
    try:
        requests.post(
            f"{BE_URL}/messages",
            json={
                "session_id": session_id,
                "sender_type": "user",
                "message_text": user_content,
            },
        ).raise_for_status()
    except Exception as e:
        print(f"Error saving user message: {e}")

    # Handle image
    if image:
        message = (
            {"text": text_input, "files": [image]} if text_input else {"files": [image]}
        )
    else:
        message = text_input

    # Lấy history từ BE để sync (tùy chọn, dùng local để nhanh)
    # history_from_be = get_conversation_history(session_id)
    # history = history_from_be  # Nếu muốn sync hoàn toàn

    # Process the input with Gemini
    history_updated, text_output, _, _ = chatbot_response(message, history, session_id)

    # Lưu assistant response lên BE
    try:
        requests.post(
            f"{BE_URL}/messages",
            json={
                "session_id": session_id,
                "sender_type": "bot",
                "message_text": text_output,
            },
        ).raise_for_status()
    except Exception as e:
        print(f"Error saving bot message: {e}")

    return history_updated, "", None, None, session_id


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

    # Load session state (giả sử giữ ở memory, bỏ DB)
    state = {"step": "none", "data": {}}  # Nếu cần persist, tích hợp BE

    # Prepare history for Gemini
    gemini_history = [
        {
            "role": "user" if msg["role"] == "user" else "model",
            "parts": [msg["content"]],
        }
        for msg in history[-10:]  # Limit to last 10 messages
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

    # System prompt (giữ nguyên)
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

Current reservations (phone-based, from DB): {json.dumps({}, ensure_ascii=False)}  # Nếu cần, call BE API để lấy
Current state step: {state['step']}
Current session data: {json.dumps(state['data'], ensure_ascii=False)}
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
        return history, "", None, None
    except Exception as e:
        print(f"Gemini error: {e}")
        history.append(
            {
                "role": "assistant",
                "content": f"**Khách**: {text_message}\nXin lỗi, có lỗi xảy ra. Hãy thử lại nhé!",
            }
        )
        return history, "", None, None

    # Process output
    resp = output.get(
        "response",
        f"**Khách**: {text_message}\nXin lỗi, tôi không hiểu. Bạn có thể hỏi về đặt bàn, menu, hoặc dịch vụ không?",
    )
    next_step = output.get("next_step", "none")
    updates = output.get("data_updates", {})
    action = output.get("reservation_action", "none")

    # Update state (memory)
    state["data"].update(updates)
    state["step"] = next_step

    # Handle reservation actions (giả sử call BE API cho reservations nếu có)
    # Ví dụ: if action == "save": requests.post(BE_RESERVATION_URL, json=data)

    if next_step == "none":
        # Kết thúc session nếu cần
        try:
            requests.put(f"{BE_URL}/sessions/{session_id}", json={"status": "closed"})
        except:
            pass

    # Append assistant response to history
    history.append({"role": "assistant", "content": resp})
    return history, resp, None, None


def get_conversation_history(session_id):
    try:
        resp = requests.get(f"{BE_URL}/sessions/{session_id}/messages")
        resp.raise_for_status()
        messages = resp.json()
        return [
            {"role": msg["sender_type"], "content": msg["message_text"]}
            for msg in messages
        ]
    except Exception as e:
        print(f"Error fetching history: {e}")
        return []


# Gradio UI
def create_ui():
    with gr.Blocks(title=f"{RESTAURANT_NAME} Chatbot") as demo:
        gr.Markdown(f"# Chatbot {RESTAURANT_NAME} - Đặt Bàn, Tư Vấn & Gợi Ý")
        gr.Markdown(
            f"Xin chào! Tôi hỗ trợ đặt bàn, tư vấn menu, dịch vụ, và hơn thế nữa.\n📍 Địa chỉ: {ADDRESS}\nGửi hình ảnh để gợi ý món, hoặc nói để tương tác!"
        )

        session_id = gr.State(None)
        chatbot = gr.Chatbot(height=400, type="messages")
        msg = gr.Textbox(placeholder="Nhập tin nhắn...", label="Bạn:")
        audio = gr.Audio(
            sources=["microphone"], type="filepath", label="Nói để đặt bàn"
        )
        image = gr.Image(type="filepath", label="Gửi hình món ăn")
        clear = gr.Button("Xóa chat")

        def handle_submit(msg, audio, image, history, sess_id):
            history_updated, text_output, _, _, new_sess_id = process_input(
                msg, audio, image, history, sess_id
            )
            return history_updated, text_output, None, None, new_sess_id

        msg.submit(
            handle_submit,
            [msg, audio, image, chatbot, session_id],
            [chatbot, msg, audio, image, session_id],
        )
        audio.upload(
            handle_submit,
            [msg, audio, image, chatbot, session_id],
            [chatbot, msg, audio, image, session_id],
        )
        image.upload(
            handle_submit,
            [msg, audio, image, chatbot, session_id],
            [chatbot, msg, audio, image, session_id],
        )

        def clear_chat():
            return None, "", None, None, None

        clear.click(
            clear_chat, None, [chatbot, msg, audio, image, session_id], queue=False
        )

    return demo


if __name__ == "__main__":
    demo = create_ui()
    demo.launch(server_name="0.0.0.0", server_port=7860)
