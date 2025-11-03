from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import uvicorn
import os
import sys
from update_model import update_artifacts
from train_model import train_model
from load_model import recommend_for_user, related_items

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

class FoodItem(BaseModel):
    id: Optional[str] = None
    food: str
    food_category: str
    keyword: Optional[str] = None

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

@app.post("/api/update-artifacts")
def api_update(payload: dict):
    try:
        new_items = payload.get("items", [])
        result = update_artifacts(new_items)
        return {"status": "success", **result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
        
class TrainRequest(BaseModel):
    data_path: str = "../model_recommend/data/data_train.csv"
    out_dir: str = "../model_recommend/result"
    epochs: int = 100

@app.post("/api/train-model")
def api_train(req: TrainRequest):
    """Huấn luyện mô hình gợi ý món ăn."""
    try:
        result = train_model(
            data_path=req.data_path,
            out_dir=req.out_dir,
            epochs=req.epochs
        )
        return {"status": "success", "result": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/recommend")
async def api_recommend(data: dict):
    user_id = data.get("user_id", "anonymous")
    top_k = data.get("top_k", 5)
    try:
        results = recommend_for_user(user_id, top_k)
        return {"status": "ok", "recommendations": results}
    except Exception as e:
        return {"status": "error", "message": str(e)}

@app.post("/api/related")
async def api_related(data: dict):
    keyword = data.get("keyword", "")
    top_k = data.get("top_k", 5)
    try:
        results = related_items(keyword, top_k)
        return {"status": "ok", "related": results}
    except Exception as e:
        return {"status": "error", "message": str(e)}

@app.get("/api/health")
async def health_check():
    return {"status": "healthy", "service": "chatbot"}


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=7860)
