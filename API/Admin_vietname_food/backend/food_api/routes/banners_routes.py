from flask import Blueprint, request, jsonify
import models.banners_model as model

banners_bp = Blueprint('banners', __name__)


def _get_payload():
    data = request.get_json(silent=True)
    if not isinstance(data, dict):
        data = request.form.to_dict()
    return data or {}


@banners_bp.route('/banners', methods=['GET'])
def list_banners():
    try:
        limit = int(request.args.get('limit', 100))
        offset = int(request.args.get('offset', 0))
        only_active = request.args.get('only_active')
        if only_active is not None:
            only_active_flag = str(only_active).lower() in ('1', 'true', 'yes')
        else:
            only_active_flag = False

        data = model.get_all(limit=limit, offset=offset, only_active=only_active_flag)
        return jsonify(data), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@banners_bp.route('/banners/<int:banner_id>', methods=['GET'])
def get_banner(banner_id):
    try:
        b = model.get_by_id(banner_id)
        if b:
            return jsonify(b), 200
        return jsonify({'message': 'Không tìm thấy banner'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@banners_bp.route('/banners', methods=['POST'])
def create_banner():
    try:
        data = _get_payload()
        if 'image' not in data:
            return jsonify({'error': 'Thiếu trường image (base64)'}), 400

        if 'is_active' in data:
            try:
                data['is_active'] = int(data['is_active'])
            except Exception:
                data['is_active'] = 1

        new_id = model.create(data)
        return jsonify({'message': 'Tạo banner thành công', 'banner_id': new_id}), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@banners_bp.route('/banners/<int:banner_id>', methods=['PUT'])
def update_banner(banner_id):
    try:
        data = _get_payload()
        if not data:
            return jsonify({'error': 'Thiếu dữ liệu để cập nhật'}), 400

        existing = model.get_by_id(banner_id)
        if not existing:
            return jsonify({'message': 'Không tìm thấy banner'}), 404

        if 'is_active' in data:
            try:
                data['is_active'] = int(data['is_active'])
            except Exception:
                data['is_active'] = 1

        ok = model.update(banner_id, data)
        if ok:
            return jsonify({'message': 'Cập nhật banner thành công'}), 200
        return jsonify({'message': 'Không có thay đổi'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@banners_bp.route('/banners/<int:banner_id>', methods=['DELETE'])
def delete_banner(banner_id):
    try:
        existing = model.get_by_id(banner_id)
        if not existing:
            return jsonify({'message': 'Không tìm thấy banner'}), 404
        ok = model.delete(banner_id)
        if ok:
            return jsonify({'message': 'Xóa banner thành công'}), 200
        return jsonify({'error': 'Không thể xóa'}), 500
    except Exception as e:
        return jsonify({'error': str(e)}), 500
