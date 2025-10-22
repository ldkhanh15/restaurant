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
genai.configure(api_key="GOOGLE_API_KEY")
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
def process_input(message, image, history, session_id, user_id="UUID1"):
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

    menu = fetch_menu()
    tables = fetch_tables()
    reservations = fetch_reservations(user_id)
    history_updated, text_output, _, _ = chatbot_response(
        message, history, session_id, menu, tables, reservations
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


def chatbot_response(message, history, session_id, menu, tables, reservations):
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

    system_prompt = f"""You are a friendly, engaging chatbot for {RESTAURANT_NAME} restaurant. Respond in natural, lively Vietnamese, making conversations personalized and fun. Avoid robotic language. Use conversation history and session data to maintain context and ensure logical responses. If the user refers to previous topics (e.g., 'change my booking' or 'that cake'), use history to respond consistently.

**IMPORTANT**: Your response must ALWAYS be a valid JSON object with the following structure, even for simple or informal inputs. Do not return plain text. Wrap the conversational response in the "response" field, starting with.

Restaurant info:
- Address: {ADDRESS}
- Open hours: {OPEN_HOURS}
- Phone: {PHONE}
- Email: {EMAIL}
- Promotions: {PROMOTIONS}
- Payments: {PAYMENTS}
- Services: {SERVICES}
- Directions: {DIRECTIONS}
- Menu: {json.dumps(menu, ensure_ascii=False)}
- Tables (available): {json.dumps(tables, ensure_ascii=False)}

Current reservations: {json.dumps(reservations, ensure_ascii=False)}
Current state step: {state['step']}
Current session data: {json.dumps(state['data'], ensure_ascii=False)}
Conversation history (last 10): {json.dumps(gemini_history, ensure_ascii=False)}

Handle ALL customer queries comprehensively, referencing history for context:
1. Check/Edit/Cancel Reservation:
   - Ask for phone/user_id if unknown.
   - Show history/details, offer edit, cancel, or add orders.
   - Confirm actions, reference prior bookings.
   - Use API calls in output if needed.
2. Book Table:
   - Gather: event, seats, location/preferences, menu_selected, allergies, special_requests, time, phone.
   - Apply promotions.
   - Confirm details before saving.
   - Only for dine-in, no shipping.
3. Menu/Food Queries:
   - Describe dishes, prices, ingredients, calories, availability.
   - Suggest based on preferences, history, or image analysis.
   - Handle dine-in orders, check status.
4. Restaurant Services:
   - Answer about payments, promotions, services, directions, events, hours.
   - Handle special requests, complaints, reviews.
5. Vision AI:
   - If image, recognize dish, suggest similar from MENU.
6. General Queries:
   - Answer reviews, staff, hygiene, etc., relate to services, offer booking if relevant.
   - Clarify politely if unclear.

Personalize responses using history. Ask for phone at end of booking/check if missing.

**Output Format**:
{{
  "response": "string",
  "next_step": "none" or "gather_event" or "gather_seats" or ...,
  "data_updates": {{}},
  "reservation_action": "none" or "save" or "update" or "cancel" or "check",
  "api_call": {{ "endpoint": "/reservations", "method": "POST", "body": {{}} }}
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

    resp = output.get(
        "response",
        f"Xin lỗi, tôi không hiểu. Bạn có thể hỏi về đặt bàn, menu, hoặc dịch vụ không?",
    )
    next_step = output.get("next_step", "none")
    updates = output.get("data_updates", {})
    action = output.get("reservation_action", "none")
    api_call = output.get("api_call", None)

    state["data"].update(updates)
    state["step"] = next_step

    if api_call:
        try:
            method = api_call.get("method", "").lower()
            endpoint = f"{BE_URL}{api_call.get('endpoint', '')}"
            body = api_call.get("body", {})
            if endpoint.endswith("/reservations") and method == "post":
                required_fields = [
                    "user_id",
                    "table_id",
                    "reservation_time",
                    "num_people",
                ]
                missing_fields = [f for f in required_fields if not body.get(f)]
                if missing_fields:
                    logger.error(
                        f"Missing fields in reservation API call: {missing_fields}"
                    )
                    resp += "\nLỗi: Thiếu thông tin cần thiết để đặt bàn. Vui lòng cung cấp đầy đủ thông tin!"
                else:
                    resp_call = requests.request(
                        method.upper(), endpoint, json=body, timeout=5
                    )
                    resp_call.raise_for_status()
            else:
                resp_call = requests.request(
                    method.upper(), endpoint, json=body, timeout=5
                )
                resp_call.raise_for_status()
        except Exception as e:
            logger.error(f"API call error: {str(e)}")
            resp += "\nLỗi thực hiện hành động, vui lòng thử lại!"

    if next_step == "none":
        try:
            resp_call = requests.put(
                f"{BE_URL}/chat/sessions/{session_id}",
                json={"status": "closed"},
                timeout=5,
            )
            resp_call.raise_for_status()
        except Exception as e:
            logger.error(f"Error closing session: {str(e)}")

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
