from flask import Blueprint, request, jsonify
import models.ingredients_model as model

ingredients_bp = Blueprint('ingredients', __name__)


def _get_payload():
    data = request.get_json(silent=True)
    if not isinstance(data, dict):
        data = request.form.to_dict()
    return data or {}


@ingredients_bp.route('/ingredients', methods=['GET'])
def list_ingredients():
    try:
        q = request.args.get('q')
        limit = int(request.args.get('limit', 100))
        offset = int(request.args.get('offset', 0))
        if q:
            data = model.search(q, limit=limit, offset=offset)
        else:
            data = model.get_all(limit=limit, offset=offset)
        return jsonify(data), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@ingredients_bp.route('/ingredients/<int:ingredient_id>', methods=['GET'])
def get_ingredient(ingredient_id):
    try:
        it = model.get_by_id(ingredient_id)
        if it:
            return jsonify(it), 200
        return jsonify({'message': 'Không tìm thấy ingredient'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@ingredients_bp.route('/ingredients', methods=['POST'])
def create_ingredient():
    try:
        data = _get_payload()
        if not data.get('name'):
            return jsonify({'error': 'Thiếu trường name'}), 400
        new_id = model.create(data)
        return jsonify({'message': 'Tạo ingredient thành công', 'ingredient_id': new_id}), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@ingredients_bp.route('/ingredients/<int:ingredient_id>', methods=['PUT'])
def update_ingredient(ingredient_id):
    try:
        data = _get_payload()
        if not data:
            return jsonify({'error': 'Thiếu dữ liệu để cập nhật'}), 400
        existing = model.get_by_id(ingredient_id)
        if not existing:
            return jsonify({'message': 'Không tìm thấy ingredient'}), 404
        ok = model.update(ingredient_id, data)
        if ok:
            return jsonify({'message': 'Cập nhật thành công'}), 200
        return jsonify({'message': 'Không có thay đổi'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@ingredients_bp.route('/ingredients/<int:ingredient_id>', methods=['DELETE'])
def delete_ingredient(ingredient_id):
    try:
        existing = model.get_by_id(ingredient_id)
        if not existing:
            return jsonify({'message': 'Không tìm thấy ingredient'}), 404
        ok = model.delete(ingredient_id)
        if ok:
            return jsonify({'message': 'Xóa thành công'}), 200
        return jsonify({'error': 'Không thể xóa'}), 500
    except Exception as e:
        return jsonify({'error': str(e)}), 500
