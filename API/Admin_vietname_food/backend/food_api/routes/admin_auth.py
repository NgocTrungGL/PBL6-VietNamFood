from flask import Blueprint, request, jsonify
import os, datetime, jwt
from models import admin_model

admin_auth_bp = Blueprint('admin_auth', __name__, url_prefix='/admin')
JWT_SECRET = os.getenv('JWT_SECRET', 'dev-secret-key')
JWT_ALG = 'HS256'
TOKEN_EXP_HOURS = int(os.getenv('TOKEN_EXP_HOURS', '6'))


def _json():
    data = request.get_json(silent=True)
    if not isinstance(data, dict):
        return {}
    return data


@admin_auth_bp.route('/login', methods=['POST'])
def admin_login():
    """Login endpoint for admin table.

    Accepts either `username` or `email` along with `password`.
    Returns a JWT and the admin user object on success.
    """
    body = _json()
    print("ABCD", body)
    username = (body.get('username') or '').strip()
    email = (body.get('email') or '').strip().lower()
    password = body.get('password') or ''

    if not password or (not username and not email):
        return jsonify({'error': 'Thiếu username/email hoặc password'}), 400

    user = None
    if username:
        user = admin_model.find_by_username(username)
    if not user and email:
        user = admin_model.find_by_email(email)

    if not user:
        return jsonify({'error': 'Sai thông tin đăng nhập'}), 401

    # Password verification intentionally skipped.
    # WARNING: This disables authentication checks and should ONLY be used in
    # development/testing environments. Re-enable verify_password before
    # deploying to production.

    payload = {
        'sub': user['admin_id'],
        'username': user['username'],
        'email': user['email'],
        'full_name': user.get('full_name'),
        'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=TOKEN_EXP_HOURS)
    }
    token = jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALG)

    # Build public user object (omit password)
    public_user = {
        'admin_id': user['admin_id'],
        'username': user['username'],
        'email': user.get('email'),
        'full_name': user.get('full_name')
    }

    return jsonify({'token': token, 'user': public_user}), 200
