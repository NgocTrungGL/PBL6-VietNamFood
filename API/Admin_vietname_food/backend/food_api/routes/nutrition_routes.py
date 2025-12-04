from flask import Blueprint, request, jsonify
import models.nutrition_info_model as model

nutrition_bp = Blueprint('nutrition', __name__)


def _get_payload():
    data = request.get_json(silent=True)
    if not isinstance(data, dict):
        data = request.form.to_dict()
    return data or {}


@nutrition_bp.route('/nutrition', methods=['GET'])
def list_nutrition():
    try:
        limit = int(request.args.get('limit', 100))
        offset = int(request.args.get('offset', 0))
        data = model.get_all(limit=limit, offset=offset)
        return jsonify(data), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@nutrition_bp.route('/nutrition/<int:food_id>', methods=['GET'])
def get_nutrition(food_id):
    try:
        r = model.get_by_id(food_id)
        if r:
            return jsonify(r), 200
        return jsonify({'message': 'Không tìm thấy thông tin dinh dưỡng cho món ăn'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@nutrition_bp.route('/nutrition', methods=['POST'])
def create_nutrition():
    try:
        data = _get_payload()
        if not data.get('food_id'):
            return jsonify({'error': 'Thiếu trường food_id'}), 400

        try:
            ok = model.create(data)
        except ValueError as ve:
            return jsonify({'error': str(ve)}), 400

        if not ok:
            return jsonify({'message': 'Thông tin dinh dưỡng đã tồn tại cho food_id này'}), 409
        return jsonify({'message': 'Thêm thông tin dinh dưỡng thành công'}), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@nutrition_bp.route('/nutrition/<int:food_id>', methods=['PUT'])
def update_nutrition(food_id):
    try:
        data = _get_payload()
        if not data:
            return jsonify({'error': 'Thiếu dữ liệu để cập nhật'}), 400

        existing = model.get_by_id(food_id)
        if not existing:
            return jsonify({'message': 'Không tìm thấy thông tin dinh dưỡng'}), 404

        ok = model.update(food_id, data)
        if ok:
            return jsonify({'message': 'Cập nhật thành công'}), 200
        return jsonify({'message': 'Không có thay đổi'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@nutrition_bp.route('/nutrition/<int:food_id>', methods=['DELETE'])
def delete_nutrition(food_id):
    try:
        existing = model.get_by_id(food_id)
        if not existing:
            return jsonify({'message': 'Không tìm thấy thông tin dinh dưỡng'}), 404

        ok = model.delete(food_id)
        if ok:
            return jsonify({'message': 'Xóa thành công'}), 200
        return jsonify({'error': 'Không thể xóa'}), 500
    except Exception as e:
        return jsonify({'error': str(e)}), 500
