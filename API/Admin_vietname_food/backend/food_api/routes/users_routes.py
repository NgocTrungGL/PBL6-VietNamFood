from flask import Blueprint, request, jsonify
import models.users_model as model
from werkzeug.security import generate_password_hash
users_bp = Blueprint('users', __name__)


def _get_payload():
    data = request.get_json(silent=True)
    if not isinstance(data, dict):
        data = request.form.to_dict()
    return data or {}


@users_bp.route('/users', methods=['GET'])
def list_users():
    try:
        q = request.args.get('q')
        limit = int(request.args.get('limit', 100))
        offset = int(request.args.get('offset', 0))
        data = model.get_all(limit=limit, offset=offset, q=q)
        # remove any password_hash if present
        return jsonify(data), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@users_bp.route('/users/<int:user_id>', methods=['GET'])
def get_user(user_id):
    try:
        u = model.get_by_id(user_id)
        if u:
            return jsonify(u), 200
        return jsonify({'message': 'Không tìm thấy user'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500


import jwt
import datetime
from flask import jsonify, request, current_app # Nhớ import current_app nếu cấu hình SECRET_KEY trong app config

@users_bp.route('/users/login', methods=['POST'])
def login_user():
    try:
        data = request.get_json(silent=True) or request.form.to_dict()
        email = data.get('email')
        password = data.get('password')

        # 1. Validate input
        if not email or not password:
            return jsonify({'error': 'Thiếu email hoặc password'}), 400

        # 2. Tìm user từ DB
        user = model.find_by_email(email)
        if not user:
            return jsonify({'message': 'Không tìm thấy user với email này'}), 404

        # 3. Kiểm tra password hash
        password_hash = user.get('password_hash')
        if not password_hash or not model.verify_password(password, password_hash):
            return jsonify({'message': 'Email hoặc mật khẩu không đúng'}), 401

        # --- 4. SINH RA TOKEN (PHẦN MỚI THÊM) ---
        # Token chứa user_id và thời gian hết hạn (ví dụ: 7 ngày)
        token_payload = {
            'user_id': user.get('user_id'), # Quan trọng nhất: Lưu ID để định danh
            'exp': datetime.datetime.utcnow() + datetime.timedelta(days=7) # Hết hạn sau 7 ngày
        }

        # SECRET_KEY nên để trong config, không nên hardcode như này nếu đi production
        secret_key = "8f42a7305491795b9e8973018545832056236009d6458e85817905639545225d"

        token = jwt.encode(token_payload, secret_key, algorithm='HS256')

        # 5. Trả về Client
        # Loại bỏ password_hash
        user.pop('password_hash', None)

        # Nhét token vào user object hoặc để ở ngoài tùy ý
        # Ở đây mình gộp vào user để khớp với UserType bên React Native
        user['token'] = token

        return jsonify({
            'message': 'Đăng nhập thành công',
            'user': user
        }), 200

    except Exception as e:
        print(e) # In lỗi ra terminal để debug
        return jsonify({'error': str(e)}), 500


@users_bp.route('/users', methods=['POST'])
def create_user():
    try:
        data = _get_payload()
        if not data.get('username') or not data.get('email') or not data.get('password'):
            return jsonify({'error': 'Thiếu username, email hoặc password'}), 400

        # check uniqueness
        if model.find_by_username(data.get('username')):
            return jsonify({'error': 'Username đã tồn tại'}), 400
        if model.find_by_email(data.get('email')):
            return jsonify({'error': 'Email đã tồn tại'}), 400

        new_id = model.create_user(
            data.get('username'), data.get('email'), data.get('password'), data.get('full_name'), data.get('avatar')
        )
        return jsonify({'message': 'Tạo user thành công', 'user_id': new_id}), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@users_bp.route('/users/<int:user_id>', methods=['PUT'])
def update_user(user_id):
    try:
        # --- 1. Xử lý Multipart/Form-data (Vì có upload ảnh) ---
        # Khi gửi file, dữ liệu text nằm trong request.form, file nằm trong request.files
        # Chúng ta lấy cả 2 gộp vào biến data
        data = request.form.to_dict()

        # Lấy user hiện tại để check
        existing = model.get_by_id(user_id)
        if not existing:
            return jsonify({'message': 'Không tìm thấy user'}), 404

        # --- 2. Validate Unique (Giữ nguyên logic của bạn) ---
        if 'username' in data:
            other = model.find_by_username(data.get('username'))
            if other and other.get('user_id') != user_id:
                return jsonify({'error': 'Username đã được sử dụng'}), 400
        if 'email' in data:
            other = model.find_by_email(data.get('email'))
            if other and other.get('user_id') != user_id:
                return jsonify({'error': 'Email đã được sử dụng'}), 400

        # --- 3. Xử lý Mật khẩu (Mã hóa trước khi lưu) ---
        if 'password' in data and data['password']:
            # Hash mật khẩu mới
            data['password_hash'] = generate_password_hash(data['password'])
            # Xóa field 'password' thô đi để không lưu vào DB
            del data['password']

        # --- 4. Xử lý Avatar (Quan trọng nhất) ---
        # Kiểm tra xem client có gửi file có key là 'avatar' không
        if 'avatar' in request.files:
            file = request.files['avatar']
            if file.filename != '':
                # Đọc dữ liệu file thành dạng bytes để lưu vào LONGBLOB
                file_bytes = file.read()
                data['avatar'] = file_bytes
                # Lưu ý: Nếu DB của bạn lưu đường dẫn (VARCHAR) thay vì BLOB
                # thì đoạn này phải là logic lưu file vào ổ cứng rồi lấy path.
                # Nhưng theo DB bạn đưa lúc đầu là LONGBLOB nên ta dùng file.read()

        # --- 5. Gọi Model Update ---
        ok = model.update_user(user_id, data)

        if ok:
            # --- 6. Trả về User mới nhất để Frontend cập nhật Context ---
            # Lấy lại thông tin user vừa update từ DB
            updated_user = model.get_by_id(user_id)
            updated_user.pop('password_hash', None) # Bỏ hash đi

            # Nếu avatar là bytes (BLOB), cần convert sang Base64 string để gửi về JSON
            # (Hoặc nếu model.get_by_id đã làm việc này rồi thì thôi)
            if updated_user.get('avatar') and isinstance(updated_user['avatar'], bytes):
                 import base64
                 encoded_img = base64.b64encode(updated_user['avatar']).decode('utf-8')
                 # Thêm header để hiển thị được ngay trên thẻ <Image>
                 updated_user['avatar'] = f"data:image/jpeg;base64,{encoded_img}"

            return jsonify({
                'message': 'Cập nhật thành công',
                'user': updated_user # Trả về cục này để React Native update Context
            }), 200

        return jsonify({'message': 'Không có thay đổi'}), 200

    except Exception as e:
        print("Update Error:", e)
        return jsonify({'error': str(e)}), 500


@users_bp.route('/users/<int:user_id>', methods=['DELETE'])
def delete_user(user_id):
    try:
        existing = model.get_by_id(user_id)
        if not existing:
            return jsonify({'message': 'Không tìm thấy user'}), 404
        ok = model.delete_user(user_id)
        if ok:
            return jsonify({'message': 'Xóa user thành công'}), 200
        return jsonify({'error': 'Không thể xóa'}), 500
    except Exception as e:
        return jsonify({'error': str(e)}), 500
