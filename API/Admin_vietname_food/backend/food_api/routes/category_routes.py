from flask import Blueprint, request, jsonify
import models.category_model as model

category_bp = Blueprint('category', __name__)


def _get_payload():
    data = request.get_json(silent=True)
    if not isinstance(data, dict):
        data = request.form.to_dict()
    return data or {}


@category_bp.route('/categories', methods=['GET'])
def list_categories():
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


@category_bp.route('/categories/<int:category_id>', methods=['GET'])
def get_category(category_id):
    try:
        c = model.get_by_id(category_id)
        if c:
            return jsonify(c), 200
        return jsonify({'message': 'Không tìm thấy category'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@category_bp.route('/categories', methods=['POST'])
def create_category():
    try:
        data = _get_payload()
        if not data.get('category_name'):
            return jsonify({'error': 'Thiếu trường category_name'}), 400
        new_id = model.create(data)
        return jsonify({'message': 'Tạo category thành công', 'category_id': new_id}), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@category_bp.route('/categories/<int:category_id>', methods=['PUT'])
def update_category(category_id):
    try:
        data = _get_payload()
        if not data:
            return jsonify({'error': 'Thiếu dữ liệu để cập nhật'}), 400
        existing = model.get_by_id(category_id)
        if not existing:
            return jsonify({'message': 'Không tìm thấy category'}), 404
        ok = model.update(category_id, data)
        if ok:
            return jsonify({'message': 'Cập nhật category thành công'}), 200
        return jsonify({'message': 'Không có thay đổi'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@category_bp.route('/categories/<int:category_id>', methods=['DELETE'])
def delete_category(category_id):
    try:
        existing = model.get_by_id(category_id)
        if not existing:
            return jsonify({'message': 'Không tìm thấy category'}), 404
        ok = model.delete(category_id)
        if ok:
            return jsonify({'message': 'Xóa category thành công'}), 200
        return jsonify({'error': 'Không thể xóa'}), 500
    except Exception as e:
        return jsonify({'error': str(e)}), 500
