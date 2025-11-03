import os
from pathlib import Path
import random
import joblib
import unidecode
import numpy as np
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.decomposition import TruncatedSVD
from sklearn.model_selection import train_test_split
import matplotlib.pyplot as plt
import tensorflow as tf
from tensorflow import keras
from tensorflow.keras import layers

# ============ CONFIG (edit as needed) ============
DATA_PATH = "../model_recommend/data/data_train.csv"   # upload to /content or mount drive
OUT_DIR = "../model_recommend/result"
SEED = 42

USER_EMB = 64
ITEM_EMB = 64
CONTENT_DIM = 64      # SVD dimension
MLP_DIMS = [256, 128, 64]
LR = 1e-3
EPOCHS = 100
BATCH_SIZE = 2048     # larger batch since labels are simple
NEG_PER_POS = 4       # number of negative samples per positive
TEST_SIZE = 0.15
TOPK_EVAL = [5, 10, 20]
RANDOM_NEG = True     # sample negatives randomly
# ================================================

np.random.seed(SEED)
tf.random.set_seed(SEED)
random.seed(SEED)
os.makedirs(OUT_DIR, exist_ok=True)

def load_and_prepare(path):
    df = pd.read_csv(path)
    # ensure columns
    for col in ["user_id", "food", "count_order", "count_search", "rating",
                "side_dish", "keyword", "regarding_food", "food_category"]:
        if col not in df.columns:
            df[col] = ""
    df['food_norm'] = df['food'].astype(str).apply(lambda x: unidecode.unidecode(x).strip().lower())
    df['count_order'] = pd.to_numeric(df['count_order'], errors='coerce').fillna(0).astype(float)
    df['count_search'] = pd.to_numeric(df['count_search'], errors='coerce').fillna(0).astype(float)
    df['rating'] = pd.to_numeric(df['rating'], errors='coerce').fillna(0).astype(float)
    # Optionally build implicit weight if needed later
    df['implicit_weight'] = np.log1p(df['count_order']) * 2.0 + np.log1p(df['count_search']) * 0.8 + (df['rating'] / 5.0) * 1.2
    # Mark positive interactions: user actually ordered the item (you can broaden this)
    df['label'] = (df['count_order'] > 0).astype(int)
    return df

def build_maps(df):
    users = df['user_id'].astype(str).unique().tolist()
    items = df['food_norm'].astype(str).unique().tolist()
    user2id = {u: i for i, u in enumerate(users)}
    item2id = {it: i for i, it in enumerate(items)}
    id2item = {v: k for k, v in item2id.items()}
    return user2id, item2id, id2item

def build_item_meta(df, item2id):
    df['item_idx'] = df['food_norm'].map(item2id).astype(int)
    meta = df.groupby('item_idx').agg({
        'keyword': lambda s: ' '.join(s.dropna().astype(str).unique()),
        'regarding_food': lambda s: ' '.join(s.dropna().astype(str).unique()),
        'food_category': lambda s: ' '.join(s.dropna().astype(str).unique()),
        'side_dish': lambda s: ' '.join(s.dropna().astype(str).unique()),
        'food': lambda s: s.iloc[0]
    }).reset_index()
    meta['content'] = (meta['keyword'].fillna('') + ' ' +
                       meta['regarding_food'].fillna('') + ' ' +
                       meta['food_category'].fillna('') + ' ' +
                       meta['side_dish'].fillna(''))
    return meta

def build_content_embeddings(item_meta, content_dim=64):
    tfidf = TfidfVectorizer(max_features=20000, ngram_range=(1,2))
    tfidf_mat = tfidf.fit_transform(item_meta['content'].astype(str).fillna(''))
    n_comp = min(content_dim, max(1, tfidf_mat.shape[1]-1))
    svd = TruncatedSVD(n_components=n_comp, random_state=SEED)
    content_emb = svd.fit_transform(tfidf_mat)
    return tfidf, svd, content_emb

def negative_sampling(df_pos, user2id, item2id, neg_per_pos=4, seed=None):
    """Construct dataset with negatives.
    df_pos: DataFrame rows that include positive interactions (label==1)
    returns DataFrame with columns user_idx, item_idx, label
    """
    if seed is not None:
        random.seed(seed)
    all_items = list(item2id.values())
    user_pos_map = df_pos.groupby('user_idx')['item_idx'].apply(set).to_dict()

    rows = []
    for user, pos_items in user_pos_map.items():
        pos_list = list(pos_items)
        for it in pos_list:
            rows.append((user, it, 1))
        # sample negatives
        n_neg = min(len(all_items) - len(pos_items), max(1, neg_per_pos * len(pos_list)))
        # sample per-user unique negatives
        negs = set()
        attempts = 0
        while len(negs) < n_neg and attempts < n_neg * 3:
            cand = random.choice(all_items) if RANDOM_NEG else np.random.choice(all_items)
            if cand not in pos_items:
                negs.add(cand)
            attempts += 1
        for itn in list(negs)[:n_neg]:
            rows.append((user, itn, 0))
    df_samples = pd.DataFrame(rows, columns=['user_idx', 'item_idx', 'label'])
    return df_samples

def make_tf_dataset(df_samples, X_content, batch_size=1024, shuffle=True):
    users = df_samples['user_idx'].values.astype(np.int32)
    items = df_samples['item_idx'].values.astype(np.int32)
    labels = df_samples['label'].values.astype(np.float32)
    # content vectors for items
    cont = X_content[items]  # index by item_idx
    ds = tf.data.Dataset.from_tensor_slices(((users, items, cont), labels))
    if shuffle:
        ds = ds.shuffle(100000, seed=SEED)
    ds = ds.batch(batch_size).prefetch(tf.data.AUTOTUNE)
    return ds

def build_model(n_users, n_items, user_emb=64, item_emb=64, content_dim=64, mlp_dims=[256,128,64], lr=1e-3):
    user_in = layers.Input(shape=(), dtype='int32', name='user_id')
    item_in = layers.Input(shape=(), dtype='int32', name='item_id')
    content_in = layers.Input(shape=(content_dim,), dtype='float32', name='item_content')

    u_emb = layers.Embedding(input_dim=n_users, output_dim=user_emb, name='user_emb')(user_in)
    i_emb = layers.Embedding(input_dim=n_items, output_dim=item_emb, name='item_emb')(item_in)
    u_vec = layers.Flatten()(u_emb)
    i_vec = layers.Flatten()(i_emb)

    # optionally add elementwise product to capture interactions
    prod = layers.Multiply()([u_vec, i_vec])
    x = layers.Concatenate()([u_vec, i_vec, prod, content_in])

    x = layers.BatchNormalization()(x)
    for d in mlp_dims:
        residual = x
        x = layers.Dense(d, activation='relu')(x)
        x = layers.BatchNormalization()(x)
        x = layers.Dropout(0.2)(x)
        # add small residual if dims match
        if residual.shape[-1] == x.shape[-1]:
            x = layers.Add()([x, residual])
            x = layers.Activation('relu')(x)

    out = layers.Dense(1, activation='sigmoid')(x)
    model = keras.Model(inputs=[user_in, item_in, content_in], outputs=out)
    model.compile(optimizer=keras.optimizers.Adam(lr), loss='binary_crossentropy', metrics=[keras.metrics.AUC(name='auc')])
    return model

# Ranking metrics
def apk(actual, predicted, k=10):
    if len(predicted) > k:
        predicted = predicted[:k]
    score = 0.0
    hits = set()
    for i, p in enumerate(predicted):
        if p in actual and p not in hits:
            hits.add(p)
            score += 1.0 / (np.log2(i+2))
    return score

def ndcg_at_k(actual, predicted, k=10):
    if len(predicted) > k:
        predicted = predicted[:k]
    dcg = 0.0
    idcg = 0.0
    for i, p in enumerate(predicted):
        if p in actual:
            dcg += 1.0 / np.log2(i+2)
    for i in range(min(len(actual), k)):
        idcg += 1.0 / np.log2(i+2)
    return dcg / idcg if idcg > 0 else 0.0

def hit_rate_at_k(actual, predicted, k=10):
    return int(len(set(actual) & set(predicted[:k])) > 0)

def evaluate_ranking(model, users_val, pos_per_user, X_content_all, id2item, topk_list=[5,10,20], batch_size=512):
    """Score all items for each user in users_val and compute Hit@K, NDCG@K, Precision@K"""
    n_items = X_content_all.shape[0]
    results = {f"HR@{k}": [] for k in topk_list}
    results.update({f"NDCG@{k}": [] for k in topk_list})
    results.update({f"PREC@{k}": [] for k in topk_list})

    # We will compute in batches of users
    users_list = list(users_val)
    for u in users_list:
        pos_items = pos_per_user.get(u, [])
        # build arrays for scoring all items
        user_arr = np.full((n_items,), u, dtype=np.int32)
        item_arr = np.arange(n_items, dtype=np.int32)
        cont_arr = X_content_all  # shape (n_items, content_dim)
        # predict in batches to avoid OOM
        preds = []
        batch = 4096
        for start in range(0, n_items, batch):
            end = min(n_items, start+batch)
            p = model.predict({'user_id': user_arr[start:end], 'item_id': item_arr[start:end], 'item_content': cont_arr[start:end]}, verbose=0)
            preds.append(p.reshape(-1))
        preds = np.concatenate(preds, axis=0)
        ranked_idx = np.argsort(-preds)  # descending
        for k in topk_list:
            topk = ranked_idx[:k].tolist()
            hr = hit_rate_at_k(pos_items, topk, k=k)
            ndcg = ndcg_at_k(pos_items, topk, k=k)
            prec = len(set(pos_items) & set(topk)) / k if k>0 else 0.0
            results[f"HR@{k}"].append(hr)
            results[f"NDCG@{k}"].append(ndcg)
            results[f"PREC@{k}"].append(prec)
    # average
    summary = {k: np.mean(v) for k, v in results.items()}
    return summary

def train_model(data_path="../model_recommend/data/data_train.csv",
                out_dir="../model_recommend/result",
                epochs=100):
    # ============ CONFIG ============
    SEED = 42
    USER_EMB = 64
    ITEM_EMB = 64
    CONTENT_DIM = 64
    MLP_DIMS = [256, 128, 64]
    LR = 1e-3
    BATCH_SIZE = 2048
    NEG_PER_POS = 4
    TEST_SIZE = 0.15
    TOPK_EVAL = [5, 10, 20]
    RANDOM_NEG = True
    # ================================================

    np.random.seed(SEED)
    tf.random.set_seed(SEED)
    random.seed(SEED)
    os.makedirs(out_dir, exist_ok=True)

    print("Loading data...")
    df = load_and_prepare(data_path)
    print("Data shape:", df.shape)

    user2id, item2id, id2item = build_maps(df)
    df['user_idx'] = df['user_id'].astype(str).map(user2id).astype(int)
    df['item_idx'] = df['food_norm'].map(item2id).astype(int)

    from sklearn.model_selection import train_test_split
    train_df, val_df = train_test_split(df, test_size=TEST_SIZE, random_state=SEED)

    item_meta = build_item_meta(df, item2id)
    tfidf, svd, content_emb = build_content_embeddings(item_meta, CONTENT_DIM)
    content_map = {int(item_meta.loc[i, 'item_idx']): content_emb[i] for i in range(len(item_meta))}
    n_items = len(item2id)
    content_dim = content_emb.shape[1]
    X_content_all = np.zeros((n_items, content_dim), dtype=np.float32)
    for i in range(n_items):
        vect = content_map.get(i, np.zeros(content_dim, dtype=np.float32))
        X_content_all[i] = vect

    # positives + negatives
    train_pos = train_df[train_df['label'] == 1].copy()
    if train_pos.empty:
        train_pos = train_df[train_df['count_search'] > 0].copy()
        train_pos['label'] = 1

    print("Generating negative samples...")
    df_samples = negative_sampling(train_pos, user2id, item2id, neg_per_pos=NEG_PER_POS, seed=SEED)
    train_ds = make_tf_dataset(df_samples, X_content_all, batch_size=BATCH_SIZE, shuffle=True)

    val_pos = val_df[val_df['label'] == 1]
    pos_per_user_val = val_pos.groupby('user_idx')['item_idx'].apply(list).to_dict()
    val_users = list(pos_per_user_val.keys())

    model = build_model(n_users=len(user2id),
                        n_items=n_items,
                        user_emb=USER_EMB,
                        item_emb=ITEM_EMB,
                        content_dim=content_dim,
                        mlp_dims=MLP_DIMS,
                        lr=LR)

    checkpoint = os.path.join(out_dir, "best_model.keras")
    cbs = [
        keras.callbacks.ModelCheckpoint(checkpoint, monitor='loss', save_best_only=True),
        keras.callbacks.EarlyStopping(monitor='loss', patience=3, restore_best_weights=True),
    ]

    print("Start training...")
    history = model.fit(train_ds, epochs=epochs, callbacks=cbs, verbose=2)

    # Save artifacts
    model.save(os.path.join(out_dir, "product_recommender_rank.keras"))
    joblib.dump(user2id, os.path.join(out_dir, "user2id.joblib"))
    joblib.dump(item2id, os.path.join(out_dir, "item2id.joblib"))
    joblib.dump(id2item, os.path.join(out_dir, "id2item.joblib"))
    joblib.dump(tfidf, os.path.join(out_dir, "tfidf.joblib"))
    joblib.dump(svd, os.path.join(out_dir, "svd.joblib"))
    item_meta.to_pickle(os.path.join(out_dir, "item_meta.pkl"))

    print("✅ Training done.")

    return {
        "n_users": len(user2id),
        "n_items": len(item2id),
        "out_dir": out_dir,
        "epochs": epochs,
        "final_loss": float(history.history['loss'][-1]),
    }