from flask import Blueprint, request, jsonify
import models.food_model as model

food_bp = Blueprint('food', __name__)


def _get_payload():
    data = request.get_json(silent=True)
    if not isinstance(data, dict):
        data = request.form.to_dict()
    return data or {}


@food_bp.route('/foods', methods=['GET'])
def list_food():
    try:
        q = request.args.get('q')
        limit = int(request.args.get('limit', 200))
        offset = int(request.args.get('offset', 0))
        category_id = request.args.get('category_id')
        origin_region_id = request.args.get('origin_region_id')

        if q:
            data = model.search(q, limit=limit, offset=offset)
        else:
            data = model.get_all(limit=limit, offset=offset)

        # apply simple in-memory filters for category_id and origin_region_id if provided
        if category_id is not None:
            try:
                cid = int(category_id)
                data = [d for d in data if d.get('category_id') == cid]
            except Exception:
                pass
        if origin_region_id is not None:
            try:
                rid = int(origin_region_id)
                data = [d for d in data if d.get('origin_region_id') == rid]
            except Exception:
                pass
        return jsonify(data), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@food_bp.route('/foods/<int:food_id>', methods=['GET'])
def get_food(food_id):
    try:
        f = model.get_by_id(food_id)
        if f:
            return jsonify(f), 200
        return jsonify({'message': 'Không tìm thấy món ăn'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@food_bp.route('/foods', methods=['POST'])
def create_food():
    try:
        data = _get_payload()
        # require name at minimum
        if not data.get('name'):
            return jsonify({'error': 'Thiếu trường name'}), 400

        # Normalize numeric fields if provided
        if 'avg_rating' in data:
            try:
                data['avg_rating'] = float(data['avg_rating'])
            except Exception:
                data['avg_rating'] = None
        if 'most_popular' in data:
            try:
                data['most_popular'] = int(data['most_popular'])
            except Exception:
                data['most_popular'] = 0

        # main_image can be provided as base64 string; model will decode it

        new_id = model.create(data)
        return jsonify({'message': 'Thêm món thành công', 'food_id': new_id}), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@food_bp.route('/foods/<int:food_id>', methods=['PUT'])
def update_food(food_id):
    try:
        data = _get_payload()
        if not data:
            return jsonify({'error': 'Thiếu dữ liệu để cập nhật'}), 400

        existing = model.get_by_id(food_id)
        if not existing:
            return jsonify({'message': 'Không tìm thấy món ăn'}), 404

        # normalize numeric fields for update
        if 'avg_rating' in data:
            try:
                data['avg_rating'] = float(data['avg_rating'])
            except Exception:
                data.pop('avg_rating', None)
        if 'most_popular' in data:
            try:
                data['most_popular'] = int(data['most_popular'])
            except Exception:
                data['most_popular'] = 0

        ok = model.update(food_id, data)
        if ok:
            return jsonify({'message': 'Cập nhật thành công'}), 200
        return jsonify({'message': 'Không có thay đổi'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@food_bp.route('/foods/<int:food_id>', methods=['DELETE'])
def delete_food(food_id):
    try:
        existing = model.get_by_id(food_id)
        if not existing:
            return jsonify({'message': 'Không tìm thấy món ăn'}), 404

        ok = model.delete(food_id)
        if ok:
            return jsonify({'message': 'Xóa thành công'}), 200
        return jsonify({'error': 'Không thể xóa'}), 500
    except Exception as e:
        return jsonify({'error': str(e)}), 500
