from flask import Blueprint, request, jsonify
import models.ai_predictions_model as model

ai_predictions_bp = Blueprint('ai_predictions', __name__)


def _get_payload():
    data = request.get_json(silent=True)
    if not isinstance(data, dict):
        data = request.form.to_dict()
    return data or {}


@ai_predictions_bp.route('/ai_predictions', methods=['GET'])
def list_predictions():
    try:
        limit = int(request.args.get('limit', 100))
        offset = int(request.args.get('offset', 0))
        user_id = request.args.get('user_id')
        predicted_food_id = request.args.get('predicted_food_id')

        if user_id is not None:
            try:
                uid = int(user_id)
                data = model.get_by_user(uid, limit=limit, offset=offset)
            except Exception:
                data = []
        else:
            data = model.get_all(limit=limit, offset=offset)

        # apply simple in-memory filter for predicted_food_id if provided
        if predicted_food_id is not None:
            try:
                pfid = int(predicted_food_id)
                data = [d for d in data if d.get('predicted_food_id') == pfid]
            except Exception:
                pass

        return jsonify(data), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@ai_predictions_bp.route('/ai_predictions/<int:prediction_id>', methods=['GET'])
def get_prediction(prediction_id):
    try:
        p = model.get_by_id(prediction_id)
        if p:
            return jsonify(p), 200
        return jsonify({'message': 'Không tìm thấy prediction'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@ai_predictions_bp.route('/ai_predictions', methods=['POST'])
def create_prediction():
    try:
        data = _get_payload()
        # `user_id` is recommended but not strictly required depending on app flow
        if 'user_id' in data:
            try:
                data['user_id'] = int(data['user_id'])
            except Exception:
                data['user_id'] = None

        if 'predicted_food_id' in data:
            try:
                data['predicted_food_id'] = int(data['predicted_food_id'])
            except Exception:
                data['predicted_food_id'] = None

        if 'confidence_score' in data:
            try:
                data['confidence_score'] = float(data['confidence_score'])
            except Exception:
                data['confidence_score'] = None

        # uploaded_image may be a base64 string; model will decode it
        new_id = model.create(data)
        return jsonify({'message': 'Tạo prediction thành công', 'prediction_id': new_id}), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@ai_predictions_bp.route('/ai_predictions/<int:prediction_id>', methods=['DELETE'])
def delete_prediction(prediction_id):
    try:
        existing = model.get_by_id(prediction_id)
        if not existing:
            return jsonify({'message': 'Không tìm thấy prediction'}), 404
        ok = model.delete(prediction_id)
        if ok:
            return jsonify({'message': 'Xóa prediction thành công'}), 200
        return jsonify({'error': 'Không thể xóa'}), 500
    except Exception as e:
        return jsonify({'error': str(e)}), 500
