from flask import Blueprint, request, jsonify
import models.food_images_model as model

food_images_bp = Blueprint('food_images', __name__)


def _get_payload():
    data = request.get_json(silent=True)
    if not isinstance(data, dict):
        data = request.form.to_dict()
    return data or {}


@food_images_bp.route('/food_images', methods=['GET'])
def list_images():
    try:
        limit = int(request.args.get('limit', 100))
        offset = int(request.args.get('offset', 0))
        food_id = request.args.get('food_id')
        if food_id is not None:
            try:
                fid = int(food_id)
                data = model.get_by_food(fid, limit=limit, offset=offset)
            except Exception:
                return jsonify({'error': 'food_id không hợp lệ'}), 400
        else:
            data = model.get_all(limit=limit, offset=offset)
        return jsonify(data), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@food_images_bp.route('/food_images/<int:image_id>', methods=['GET'])
def get_image(image_id):
    try:
        img = model.get_all_by_food_id(image_id)
        if img:
            return jsonify(img), 200
        return jsonify({'message': 'Không tìm thấy image'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@food_images_bp.route('/food_images', methods=['POST'])
def create_image():
    try:
        data = _get_payload()
        if 'food_id' not in data or 'image_data' not in data:
            return jsonify({'error': 'Thiếu food_id hoặc image_data (base64)'}), 400
        try:
            data['food_id'] = int(data.get('food_id'))
        except Exception:
            return jsonify({'error': 'food_id phải là số nguyên'}), 400

        new_id = model.create(data)
        return jsonify({'message': 'Tạo image thành công', 'image_id': new_id}), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@food_images_bp.route('/food_images/<int:image_id>', methods=['PUT'])
def update_image(image_id):
    try:
        data = _get_payload()
        if not data:
            return jsonify({'error': 'Thiếu dữ liệu để cập nhật'}), 400

        existing = model.get_by_id(image_id)
        if not existing:
            return jsonify({'message': 'Không tìm thấy image'}), 404

        ok = model.update(image_id, data)
        if ok:
            return jsonify({'message': 'Cập nhật image thành công'}), 200
        return jsonify({'message': 'Không có thay đổi'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@food_images_bp.route('/food_images/<int:image_id>', methods=['DELETE'])
def delete_image(image_id):
    try:
        existing = model.get_by_id(image_id)
        if not existing:
            return jsonify({'message': 'Không tìm thấy image'}), 404
        ok = model.delete(image_id)
        if ok:
            return jsonify({'message': 'Xóa image thành công'}), 200
        return jsonify({'error': 'Không thể xóa'}), 500
    except Exception as e:
        return jsonify({'error': str(e)}), 500
