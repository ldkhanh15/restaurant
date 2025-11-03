import os
import joblib
import unidecode
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.decomposition import TruncatedSVD

ARTIFACT_DIR = "../model_recommend/result"
ITEM_META_PATH = os.path.join(ARTIFACT_DIR, "item_meta.pkl")
TFIDF_PATH = os.path.join(ARTIFACT_DIR, "tfidf.joblib")
SVD_PATH = os.path.join(ARTIFACT_DIR, "svd.joblib")
ITEM2ID_PATH = os.path.join(ARTIFACT_DIR, "item2id.joblib")
ID2ITEM_PATH = os.path.join(ARTIFACT_DIR, "id2item.joblib")

CONTENT_DIM = 64  # must match training
MAX_FEATURES = 20000  # must match training

def update_artifacts(new_items: list[dict]):
    """
    new_items: danh sách dict có field ['food', 'keyword', 'food_category', 'regarding_food', 'side_dish']
    """
    print("🔄 Updating artifacts...")

    if not os.path.exists(ITEM_META_PATH):
        raise FileNotFoundError(f"❌ Không tìm thấy {ITEM_META_PATH}")

    # Load các artifact cũ
    item_meta = pd.read_pickle(ITEM_META_PATH)
    item2id = joblib.load(ITEM2ID_PATH)
    id2item = joblib.load(ID2ITEM_PATH)

    # Chuẩn hóa & thêm món mới
    new_meta_rows = []
    for item in new_items:
        food = item.get("food", "").strip()
        food_norm = unidecode.unidecode(food).lower()

        # Nếu món đã tồn tại, bỏ qua
        if food_norm in item2id:
            continue

        idx = len(item2id)
        item2id[food_norm] = idx
        id2item[idx] = food_norm

        keyword = item.get("keyword", "")
        food_category = item.get("food_category", "")
        regarding_food = item.get("regarding_food", "")
        side_dish = item.get("side_dish", "")

        content = f"{keyword} {regarding_food} {food_category} {side_dish}".strip()

        new_meta_rows.append({
            "item_idx": idx,
            "food": food,
            "keyword": keyword,
            "regarding_food": regarding_food,
            "food_category": food_category,
            "side_dish": side_dish,
            "content": content
        })

    if not new_meta_rows:
        print("⚠️ Không có món mới để cập nhật.")
        return {"message": "No new items added.", "num_items": len(item2id)}

    # Append vào item_meta
    new_meta_df = pd.DataFrame(new_meta_rows)
    item_meta = pd.concat([item_meta, new_meta_df], ignore_index=True)

    # TF-IDF + SVD (retrain embeddings toàn bộ)
    tfidf = TfidfVectorizer(max_features=MAX_FEATURES, ngram_range=(1,2))
    tfidf_matrix = tfidf.fit_transform(item_meta['content'].astype(str).fillna(""))

    svd = TruncatedSVD(n_components=CONTENT_DIM, random_state=42)
    svd.fit(tfidf_matrix)

    # Lưu lại tất cả
    os.makedirs(ARTIFACT_DIR, exist_ok=True)
    item_meta.to_pickle(ITEM_META_PATH)
    joblib.dump(item2id, ITEM2ID_PATH)
    joblib.dump(id2item, ID2ITEM_PATH)
    joblib.dump(tfidf, TFIDF_PATH)
    joblib.dump(svd, SVD_PATH)

    print(f"✅ Updated TF-IDF, SVD, and item mappings ({len(item2id)} items).")

    return {
        "message": f"Added {len(new_meta_rows)} new items.",
        "num_items": len(item2id)
    }
