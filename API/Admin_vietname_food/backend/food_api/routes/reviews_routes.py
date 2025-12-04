from flask import Blueprint, request, jsonify
import models.reviews_model as model
import base64
reviews_bp = Blueprint('reviews', __name__)


def _get_payload():
    data = request.get_json(silent=True)
    if not isinstance(data, dict):
        data = request.form.to_dict()
    return data or {}


@reviews_bp.route('/reviews', methods=['GET'])
def list_reviews():
    try:
        user_id = request.args.get('user_id')
        food_id = request.args.get('food_id')
        q = request.args.get('q')
        limit = int(request.args.get('limit', 100))
        offset = int(request.args.get('offset', 0))

        uid = int(user_id) if user_id is not None else None
        fid = int(food_id) if food_id is not None else None
        data = model.get_all(limit=limit, offset=offset, user_id=uid, food_id=fid, q=q)
        return jsonify(data), 200
    except ValueError as ve:
        return jsonify({'error': str(ve)}), 400
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@reviews_bp.route('/reviews/<int:food_id>', methods=['GET'])
def get_reviews_by_food(food_id):
    try:
        # Gọi hàm model bạn vừa sửa ở bước trước
        reviews_list = model.get_all_by_food_id(food_id)

        # Nếu không có review nào, trả về danh sách rỗng (vẫn là thành công 200)
        if not reviews_list:
            return jsonify([]), 200

        # 2. Duyệt qua từng review để xử lý Avatar (Binary -> Base64)
        for r in reviews_list:
            avatar_data = r.get('user_avatar')

            if avatar_data:
                # Nếu là bytes (BLOB từ DB) -> Convert sang Base64 string
                if isinstance(avatar_data, bytes):
                    b64_str = base64.b64encode(avatar_data).decode('utf-8')
                    # Thêm header chuẩn để Frontend hiển thị được ngay
                    r['user_avatar'] = f"data:image/jpeg;base64,{b64_str}"

                # Nếu là string (có thể là URL cũ hoặc base64 lưu dạng text)
                elif isinstance(avatar_data, str):
                    # Nếu chưa có header thì thêm vào (trừ khi là link http)
                    if not avatar_data.startswith('http') and not avatar_data.startswith('data:'):
                        r['user_avatar'] = f"data:image/jpeg;base64,{avatar_data}"
            else:
                # Nếu user không có avatar -> Trả về null hoặc link ảnh mặc định
                r['user_avatar'] = None
                # Hoặc: "https://cdn-icons-png.flaticon.com/512/149/149071.png"

        return jsonify(reviews_list), 200

    except Exception as e:
        print(f"Lỗi lấy reviews: {e}") # Log lỗi ra terminal để debug
        return jsonify({'error': str(e)}), 500


@reviews_bp.route('/reviews', methods=['POST'])
def create_review():
    try:
        data = _get_payload()
        if 'user_id' not in data or 'food_id' not in data or 'rating' not in data:
            return jsonify({'error': 'Thiếu user_id, food_id hoặc rating'}), 400

        result = model.create(data)
        # result: {'created': bool, 'review_id': int, 'created_at': datetime}
        created = result.get('created')
        rid = result.get('review_id')
        ts = result.get('created_at')
        ts_str = ts.isoformat() if hasattr(ts, 'isoformat') else ts
        if created:
            return jsonify({'message': 'Tạo review thành công', 'review_id': rid, 'created_at': ts_str}), 201
        return jsonify({'message': 'Đã tồn tại review cho user-food', 'review_id': rid, 'created_at': ts_str}), 200
    except ValueError as ve:
        return jsonify({'error': str(ve)}), 400
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@reviews_bp.route('/reviews/<int:review_id>', methods=['PUT'])
def update_review(review_id):
    try:
        data = _get_payload()
        if not data:
            return jsonify({'error': 'Thiếu dữ liệu để cập nhật'}), 400

        existing = model.get_by_id(review_id)
        if not existing:
            return jsonify({'message': 'Không tìm thấy review'}), 404

        ok = model.update(review_id, data)
        if ok:
            return jsonify({'message': 'Cập nhật review thành công'}), 200
        return jsonify({'message': 'Không có thay đổi'}), 200
    except ValueError as ve:
        return jsonify({'error': str(ve)}), 400
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@reviews_bp.route('/reviews/<int:review_id>', methods=['DELETE'])
def delete_review(review_id):
    try:
        existing = model.get_by_id(review_id)
        if not existing:
            return jsonify({'message': 'Không tìm thấy review'}), 404
        ok = model.delete(review_id)
        if ok:
            return jsonify({'message': 'Xóa review thành công'}), 200
        return jsonify({'error': 'Không thể xóa'}), 500
    except Exception as e:
        return jsonify({'error': str(e)}), 500
@reviews_bp.route('/reviews', methods=['POST'])
def add_review():
    data = request.json
    user_id = data.get('user_id')
    food_id = data.get('food_id')
    rating = data.get('rating')
    comment = data.get('comment')

    if not all([user_id, food_id, rating]):
        return jsonify({'error': 'Thiếu thông tin'}), 400

    conn = model.get_connection()
    cursor = conn.cursor()
    try:
        query = """
            INSERT INTO reviews (user_id, food_id, rating, comment)
            VALUES (%s, %s, %s, %s)
        """
        cursor.execute(query, (user_id, food_id, rating, comment))
        conn.commit()
        return jsonify({'message': 'Đánh giá thành công'}), 201
    except Exception as e:
        # Nếu user đã review rồi (dính UNIQUE KEY) thì báo lỗi
        return jsonify({'error': 'Bạn đã đánh giá món này rồi!'}), 400
    finally:
        conn.close()
