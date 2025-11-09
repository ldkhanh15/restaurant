from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import uvicorn
import os
import sys
import logging
import json

# Add the chatbot directory to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Import minimal generation helper from chatbot.py
from chatbot import chatbot_response

logger = logging.getLogger(__name__)


app = FastAPI(title="HIWELL Chatbot Minimal API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class GenerateRequest(BaseModel):
    message: str
    user_id: Optional[str] = "anonymous"
    session_id: Optional[str] = None
    token: Optional[str] = None  # JWT token for authenticated requests


class GenerateResponse(BaseModel):
    response: str

class FoodItem(BaseModel):
    id: Optional[str] = None
    food: str
    food_category: str
    keyword: Optional[str] = None

@app.post("/api/generate", response_model=GenerateResponse)
async def generate(request: GenerateRequest):
    try:
        from api_helpers import (
            fetch_menu,
            fetch_tables,
            fetch_reservations,
            fetch_orders,
            fetch_vouchers,
            fetch_events,
        )

        # Log token status for debugging
        if request.token:
            logger.info(
                f"Chatbot request received with token (user_id={request.user_id}, token_length={len(request.token) if request.token else 0})"
            )
        else:
            logger.warning(
                f"Chatbot request received without token (user_id={request.user_id})"
            )

        # Fetch data from APIs with token if available
        try:
            menu = fetch_menu(request.token)
            logger.debug(
                f"Fetched menu: {type(menu)}, length: {len(menu) if isinstance(menu, list) else 'N/A'}"
            )
        except Exception as e:
            logger.error(f"Error fetching menu: {str(e)}")
            menu = []

        try:
            tables = fetch_tables(request.token)
            logger.debug(
                f"Fetched tables: {type(tables)}, length: {len(tables) if isinstance(tables, list) else 'N/A'}"
            )
        except Exception as e:
            logger.error(f"Error fetching tables: {str(e)}")
            tables = []

        try:
            reservations = (
                fetch_reservations(request.user_id, request.token)
                if request.user_id and request.user_id != "anonymous"
                else []
            )
            logger.debug(
                f"Fetched reservations: {type(reservations)}, length: {len(reservations) if isinstance(reservations, list) else 'N/A'}"
            )
        except Exception as e:
            logger.error(f"Error fetching reservations: {str(e)}")
            reservations = []

        try:
            orders = (
                fetch_orders(request.user_id, request.token)
                if request.user_id and request.user_id != "anonymous"
                else []
            )
            logger.debug(
                f"Fetched orders: {type(orders)}, length: {len(orders) if isinstance(orders, list) else 'N/A'}"
            )
        except Exception as e:
            logger.error(f"Error fetching orders: {str(e)}")
            orders = []

        try:
            vouchers = fetch_vouchers(request.token)
            logger.debug(
                f"Fetched vouchers: {type(vouchers)}, length: {len(vouchers) if isinstance(vouchers, list) else 'N/A'}"
            )
        except Exception as e:
            logger.error(f"Error fetching vouchers: {str(e)}")
            vouchers = []

        try:
            events = fetch_events(request.token)
            logger.debug(
                f"Fetched events: {type(events)}, length: {len(events) if isinstance(events, list) else 'N/A'}"
            )
        except Exception as e:
            logger.error(f"Error fetching events: {str(e)}")
            events = []

        try:
            _, resp_text, _, _ = chatbot_response(
                request.message,
                [],
                request.session_id,
                menu,
                tables,
                reservations,
                orders,
                vouchers,
                events,
                request.user_id,
                request.token,
            )

            # Ensure resp_text is a string, not a JSON object
            if isinstance(resp_text, dict):
                # If resp_text is a dict, try to extract the response field
                resp_text = resp_text.get(
                    "response", json.dumps(resp_text, ensure_ascii=False)
                )
            elif not isinstance(resp_text, str):
                resp_text = str(resp_text)

            # Strip any leading/trailing whitespace and ensure it's not empty
            resp_text = (resp_text or "").strip()

            logger.debug(
                f"Returning response (length={len(resp_text)}, type={type(resp_text).__name__})"
            )

            return GenerateResponse(response=resp_text)
        except Exception as e:
            import traceback

            logger.error(f"Error in chatbot_response: {str(e)}")
            logger.error(f"Traceback: {traceback.format_exc()}")
            # Graceful fallback instead of 500
            return GenerateResponse(
                response="Xin lỗi, hệ thống đang bận. Vui lòng thử lại sau!"
            )
    except Exception as e:
        import traceback

        logger.error(f"Error in generate: {str(e)}")
        logger.error(f"Traceback: {traceback.format_exc()}")
        # Graceful fallback instead of 500
        return GenerateResponse(
            response="Xin lỗi, hệ thống đang bận. Vui lòng thử lại sau!"
        )


@app.get("/api/health")
async def health_check():
    return {"status": "healthy", "service": "chatbot"}


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=7860)
