# model_utils/recommender.py
import tensorflow as tf
import joblib
import numpy as np
import pandas as pd
from sklearn.metrics.pairwise import cosine_similarity
import os

MODEL_DIR = "../model_recommend/result"
_model = None
_user2id = None
_item2id = None
_tfidf = None
_svd = None
_item_meta = None
_name_col = None

def load_model():
    global _model, _user2id, _item2id, _tfidf, _svd, _item_meta, _name_col
    if _model is not None:
        return  # Đã load rồi

    print("🔄 Loading model and artifacts...")
    _model = tf.keras.models.load_model(os.path.join(MODEL_DIR, "best_model.keras"))
    _user2id = joblib.load(os.path.join(MODEL_DIR, "user2id.joblib"))
    _item2id = joblib.load(os.path.join(MODEL_DIR, "item2id.joblib"))
    _tfidf = joblib.load(os.path.join(MODEL_DIR, "tfidf.joblib"))
    _svd = joblib.load(os.path.join(MODEL_DIR, "svd.joblib"))
    _item_meta = joblib.load(os.path.join(MODEL_DIR, "item_meta.pkl"))

    # Xác định cột tên sản phẩm
    for col in ["food", "name", "title", "keyword"]:
        if col in _item_meta.columns:
            _name_col = col
            break
    if _name_col is None:
        raise ValueError("Không tìm thấy cột tên sản phẩm trong item_meta!")

    print("✅ Model and artifacts loaded.")


def recommend_for_user(user_id: str, top_k: int = 5):
    load_model()  # đảm bảo model đã được load

    if user_id not in _user2id:
        sorted_items = sorted(_item_meta[_name_col].astype(str).unique())[:top_k]
        return [(item, 0.0) for item in sorted_items]

    user_idx = _user2id[user_id]
    all_items = list(_item2id.values())

    user_input = np.array([user_idx] * len(all_items))
    item_input = np.array(all_items)

    # Vector nội dung
    item_texts = _item_meta["keyword"].astype(str).values
    item_vectors = _svd.transform(_tfidf.transform(item_texts))

    preds = _model.predict([user_input, item_input, item_vectors], verbose=0).reshape(-1)
    top_idx = preds.argsort()[-top_k:][::-1]

    results = [(_item_meta.iloc[i][_name_col], float(preds[i])) for i in top_idx]
    return results


def related_items(keyword: str, top_k: int = 5):
    load_model()

    item_texts = _item_meta["keyword"].astype(str).values
    tfidf_vec = _tfidf.transform(item_texts)
    svd_vec = _svd.transform(tfidf_vec)

    query_vec = _svd.transform(_tfidf.transform([keyword]))
    sims = cosine_similarity(query_vec, svd_vec).flatten()
    top_idx = sims.argsort()[-top_k:][::-1]

    return [(_item_meta.iloc[i][_name_col], float(sims[i])) for i in top_idx]
