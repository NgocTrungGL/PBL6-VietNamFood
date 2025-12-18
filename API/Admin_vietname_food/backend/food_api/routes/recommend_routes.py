from flask import Blueprint, jsonify, request
import models.food_model as food_model
import json
import numpy as np
import os
import models.favorites_model as model  # sử dụng đúng file favorites_model
import base64
recommend_bp = Blueprint("recommend", __name__)

# ============================================
# Load vector file
# ============================================
VEC_PATH = os.path.join(os.path.dirname(__file__), "..", "utils", "dish_vectors.json")
with open(VEC_PATH, "r", encoding="utf-8") as f:
    vectors = json.load(f)


def cosine_similarity(a, b):
    a = np.array(a)
    b = np.array(b)
    denom = np.linalg.norm(a) * np.linalg.norm(b)
    if denom == 0:
        return 0.0
    return float(np.dot(a, b) / denom)


# ==========================================================
# 1. GỢI Ý THEO FOOD ID
# ==========================================================
@recommend_bp.route("/recommend/<int:food_id>", methods=["GET"])
def recommend_by_food(food_id):
    try:
        food_id_str = str(food_id)

        if food_id_str not in vectors:
            return jsonify({"error": "ID món ăn không tồn tại"}), 404

        target_vec = vectors[food_id_str]
        scores = []

        for other_id, vec in vectors.items():
            if other_id == food_id_str:
                continue

            score = cosine_similarity(target_vec, vec)
            scores.append((int(other_id), score))


        top_ids = [fid for fid, _ in sorted(scores, key=lambda x: -x[1])[:6]]
        # Lấy thông tin chi tiết từng món ăn
        food_details = [food_model.get_by_id(fid) for fid in top_ids]

        return jsonify({
            "food_id": food_id,
            "recommend_ids": top_ids,
            "recommend_foods": food_details
        }), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ==========================================================
# 2. GỢI Ý THEO USER FAVORITES (món user thích gần nhất)
# ==========================================================
@recommend_bp.route("/recommend/user/<int:user_id>", methods=["GET"])
def recommend_by_user(user_id):
    try:
        # 1. Lấy món yêu thích gần nhất
        last_fav_list = model.get_by_user(user_id, limit=1, offset=0)

        if not last_fav_list:
            return jsonify({"error": "User chưa thích món nào"}), 404

        last_fav = last_fav_list[0]
        favorite_food_id = str(last_fav["food_id"])

        if favorite_food_id not in vectors:
            return jsonify({"error": "Món yêu thích của user không có vector"}), 400

        target_vec = vectors[favorite_food_id]
        scores = []

        # 2. Tính toán độ tương đồng
        for other_id, vec in vectors.items():
            if other_id == favorite_food_id:
                continue
            score = cosine_similarity(target_vec, vec)
            scores.append((int(other_id), score))

        # 3. Lấy Top 8 ID có điểm cao nhất
        # 👇 Dòng này quan trọng, cần phải có để định nghĩa top_ids
        top_ids = [fid for fid, _ in sorted(scores, key=lambda x: -x[1])[:8]]

        # 4. Lấy chi tiết món ăn và Xử lý ảnh
        food_details = []
        for fid in top_ids:
            food = food_model.get_by_id(fid)
            if food:
                image_data = food.get('main_image')

                # Xử lý ảnh: Bytes -> Base64, String -> Giữ nguyên
                if image_data is not None:
                    if isinstance(image_data, bytes):
                        # Convert bytes sang string base64
                        food['main_image'] = base64.b64encode(image_data).decode('utf-8')
                    elif isinstance(image_data, str):
                        # Nếu là URL hoặc Base64 dạng text thì giữ nguyên
                        food['main_image'] = image_data.strip()

                food_details.append(food)

        return jsonify({
            "user_id": user_id,
            "based_on_favorite": int(favorite_food_id),
            "recommend_ids": top_ids,
            "recommend_foods": food_details
        }), 200

    except Exception as e:
        print(f"Error in recommend: {e}")
        return jsonify({"error": str(e)}), 500
