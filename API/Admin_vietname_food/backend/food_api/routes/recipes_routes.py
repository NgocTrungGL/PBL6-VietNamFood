from flask import Blueprint, request, jsonify
import models.recipes_model as model

recipes_bp = Blueprint('recipes', __name__)


def _get_payload():
    data = request.get_json(silent=True)
    if not isinstance(data, dict):
        data = request.form.to_dict()
    return data or {}


@recipes_bp.route('/recipes', methods=['GET'])
def list_recipes():
    try:
        q = request.args.get('q')
        limit = int(request.args.get('limit', 100))
        offset = int(request.args.get('offset', 0))
        food_id = request.args.get('food_id')
        author_id = request.args.get('author_id')

        fid = int(food_id) if food_id is not None else None
        aid = int(author_id) if author_id is not None else None

        data = model.get_all(q=q, limit=limit, offset=offset, food_id=fid, author_id=aid)
        return jsonify(data), 200
    except ValueError as ve:
        return jsonify({'error': str(ve)}), 400
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@recipes_bp.route('/recipes/<int:recipe_id>', methods=['GET'])
def get_recipe(recipe_id):
    try:
        r = model.get_by_id(recipe_id)
        if r:
            return jsonify(r), 200
        return jsonify({'message': 'Không tìm thấy recipe'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@recipes_bp.route('/recipes', methods=['POST'])
def create_recipe():
    try:
        data = _get_payload()
        new_id = model.create(data)
        return jsonify({'message': 'Tạo recipe thành công', 'recipe_id': new_id}), 201
    except ValueError as ve:
        return jsonify({'error': str(ve)}), 400
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@recipes_bp.route('/recipes/<int:recipe_id>', methods=['PUT'])
def update_recipe(recipe_id):
    try:
        data = _get_payload()
        if not data:
            return jsonify({'error': 'Thiếu dữ liệu để cập nhật'}), 400
        existing = model.get_by_id(recipe_id)
        if not existing:
            return jsonify({'message': 'Không tìm thấy recipe'}), 404
        ok = model.update(recipe_id, data)
        if ok:
            return jsonify({'message': 'Cập nhật recipe thành công'}), 200
        return jsonify({'message': 'Không có thay đổi'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@recipes_bp.route('/recipes/<int:recipe_id>', methods=['DELETE'])
def delete_recipe(recipe_id):
    try:
        existing = model.get_by_id(recipe_id)
        if not existing:
            return jsonify({'message': 'Không tìm thấy recipe'}), 404
        ok = model.delete(recipe_id)
        if ok:
            return jsonify({'message': 'Xóa recipe thành công'}), 200
        return jsonify({'error': 'Không thể xóa'}), 500
    except Exception as e:
        return jsonify({'error': str(e)}), 500
