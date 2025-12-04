from flask import Blueprint, request, jsonify
import models.regions_model as model

regions_bp = Blueprint('regions', __name__)


def _get_payload():
    data = request.get_json(silent=True)
    if not isinstance(data, dict):
        data = request.form.to_dict()
    return data or {}


@regions_bp.route('/regions', methods=['GET'])
def list_regions():
    try:
        q = request.args.get('q')
        limit = int(request.args.get('limit', 100))
        offset = int(request.args.get('offset', 0))
        parent_region_id = request.args.get('parent_region_id')
        prid = int(parent_region_id) if parent_region_id is not None else None
        data = model.get_all(limit=limit, offset=offset, parent_region_id=prid, q=q)
        return jsonify(data), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@regions_bp.route('/regions/<int:region_id>', methods=['GET'])
def get_region(region_id):
    try:
        r = model.get_by_id(region_id)
        if r:
            return jsonify(r), 200
        return jsonify({'message': 'Không tìm thấy region'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@regions_bp.route('/regions', methods=['POST'])
def create_region():
    try:
        data = _get_payload()
        if not data.get('region_name'):
            return jsonify({'error': 'Thiếu trường region_name'}), 400
        new_id = model.create(data)
        return jsonify({'message': 'Tạo region thành công', 'region_id': new_id}), 201
    except ValueError as ve:
        return jsonify({'error': str(ve)}), 400
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@regions_bp.route('/regions/<int:region_id>', methods=['PUT'])
def update_region(region_id):
    try:
        data = _get_payload()
        if not data:
            return jsonify({'error': 'Thiếu dữ liệu để cập nhật'}), 400
        existing = model.get_by_id(region_id)
        if not existing:
            return jsonify({'message': 'Không tìm thấy region'}), 404
        ok = model.update(region_id, data)
        if ok:
            return jsonify({'message': 'Cập nhật region thành công'}), 200
        return jsonify({'message': 'Không có thay đổi'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@regions_bp.route('/regions/<int:region_id>', methods=['DELETE'])
def delete_region(region_id):
    try:
        existing = model.get_by_id(region_id)
        if not existing:
            return jsonify({'message': 'Không tìm thấy region'}), 404
        ok = model.delete(region_id)
        if ok:
            return jsonify({'message': 'Xóa region thành công'}), 200
        return jsonify({'error': 'Không thể xóa'}), 500
    except Exception as e:
        return jsonify({'error': str(e)}), 500
