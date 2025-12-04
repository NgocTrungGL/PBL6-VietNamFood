from flask import Blueprint, request, jsonify
import models.food_ingredients_model as model

food_ingredients_bp = Blueprint('food_ingredients', __name__)


def _get_payload():
    data = request.get_json(silent=True)
    if not isinstance(data, dict):
        data = request.form.to_dict()
    return data or {}


@food_ingredients_bp.route('/food_ingredients', methods=['GET'])
def list_relations():
    try:
        limit = int(request.args.get('limit', 500))
        offset = int(request.args.get('offset', 0))
        food_id = request.args.get('food_id')
        ingredient_id = request.args.get('ingredient_id')
        is_primary = request.args.get('is_primary')

        fid = int(food_id) if food_id is not None else None
        iid = int(ingredient_id) if ingredient_id is not None else None

        data = model.get_all(limit=limit, offset=offset, food_id=fid, ingredient_id=iid, is_primary=is_primary)
        return jsonify(data), 200
    except ValueError as ve:
        return jsonify({'error': str(ve)}), 400
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@food_ingredients_bp.route('/food_ingredients/<int:food_id>/<int:ingredient_id>', methods=['GET'])
def get_relation(food_id, ingredient_id):
    try:
        r = model.get_by_key(food_id, ingredient_id)
        if r:
            return jsonify(r), 200
        return jsonify({'message': 'Không tìm thấy relation'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@food_ingredients_bp.route('/food_ingredients', methods=['POST'])
def create_relation():
    try:
        data = _get_payload()
        if 'food_id' not in data or 'ingredient_id' not in data:
            return jsonify({'error': 'Thiếu food_id hoặc ingredient_id'}), 400
        try:
            data['food_id'] = int(data.get('food_id'))
            data['ingredient_id'] = int(data.get('ingredient_id'))
        except Exception:
            return jsonify({'error': 'food_id và ingredient_id phải là số nguyên'}), 400

        created = model.create(data)
        if created:
            return jsonify({'message': 'Tạo relation thành công'}), 201
        return jsonify({'message': 'Relation đã tồn tại'}), 200
    except ValueError as ve:
        return jsonify({'error': str(ve)}), 400
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@food_ingredients_bp.route('/food_ingredients/<int:food_id>/<int:ingredient_id>', methods=['PUT'])
def update_relation(food_id, ingredient_id):
    try:
        data = _get_payload()
        if not data:
            return jsonify({'error': 'Thiếu dữ liệu để cập nhật'}), 400

        existing = model.get_by_key(food_id, ingredient_id)
        if not existing:
            return jsonify({'message': 'Không tìm thấy relation'}), 404

        ok = model.update(food_id, ingredient_id, data)
        if ok:
            return jsonify({'message': 'Cập nhật relation thành công'}), 200
        return jsonify({'message': 'Không có thay đổi'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@food_ingredients_bp.route('/food_ingredients/<int:food_id>/<int:ingredient_id>', methods=['DELETE'])
def delete_relation(food_id, ingredient_id):
    try:
        existing = model.get_by_key(food_id, ingredient_id)
        if not existing:
            return jsonify({'message': 'Không tìm thấy relation'}), 404
        ok = model.delete(food_id, ingredient_id)
        if ok:
            return jsonify({'message': 'Xóa relation thành công'}), 200
        return jsonify({'error': 'Không thể xóa'}), 500
    except Exception as e:
        return jsonify({'error': str(e)}), 500
