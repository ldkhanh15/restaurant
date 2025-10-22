from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import uvicorn
import os
import sys

# Add the chatbot directory to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Import minimal generation helper from chatbot.py
from chatbot import chatbot_response


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


class GenerateResponse(BaseModel):
    response: str


@app.post("/api/generate", response_model=GenerateResponse)
async def generate(request: GenerateRequest):
    # Avoid external dependencies to keep this endpoint robust
    menu = []
    tables = []
    reservations = []
    try:
        _, resp_text, _, _ = chatbot_response(
            request.message, [], request.session_id, menu, tables, reservations
        )
        return GenerateResponse(response=resp_text or "")
    except Exception:
        # Graceful fallback instead of 500
        return GenerateResponse(
            response="Xin lỗi, hệ thống đang bận. Vui lòng thử lại sau!"
        )


@app.get("/api/health")
async def health_check():
    return {"status": "healthy", "service": "chatbot"}


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=7860)
