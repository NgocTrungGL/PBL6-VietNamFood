import mysql.connector
from config import db_config
from datetime import datetime
from werkzeug.security import generate_password_hash, check_password_hash
import base64


def get_connection():
    return mysql.connector.connect(**db_config)


def find_by_username(username: str):
    conn = get_connection()
    cur = conn.cursor(dictionary=True)
    cur.execute("SELECT user_id, username, email, password_hash, full_name, avatar, created_at, updated_at FROM users WHERE username=%s", (username,))
    row = cur.fetchone()
    if row and row.get('avatar') is not None:
        try:
            row['avatar'] = base64.b64encode(row['avatar']).decode('ascii')
        except Exception:
            row['avatar'] = None
    cur.close(); conn.close()
    return row


def find_by_email(email: str):
    conn = get_connection()
    cur = conn.cursor(dictionary=True)
    cur.execute("SELECT user_id, username, email, password_hash, full_name, avatar, created_at, updated_at FROM users WHERE email=%s", (email,))
    row = cur.fetchone()
    if row and row.get('avatar') is not None:
        try:
            row['avatar'] = base64.b64encode(row['avatar']).decode('ascii')
        except Exception:
            row['avatar'] = None
    cur.close(); conn.close()
    return row


def get_by_id(user_id: int):
    conn = get_connection()
    cur = conn.cursor(dictionary=True)
    cur.execute("SELECT user_id, username, email, full_name, avatar, created_at, updated_at FROM users WHERE user_id=%s", (user_id,))
    row = cur.fetchone()
    if row and row.get('avatar') is not None:
        try:
            row['avatar'] = base64.b64encode(row['avatar']).decode('ascii')
        except Exception:
            row['avatar'] = None
    cur.close(); conn.close()
    return row


def get_all(limit: int = 100, offset: int = 0, q: str = None):
    conn = get_connection()
    cur = conn.cursor(dictionary=True)
    if q:
        like = f"%{q}%"
        cur.execute("SELECT user_id, username, email, full_name, avatar, created_at, updated_at FROM users WHERE username LIKE %s OR full_name LIKE %s ORDER BY user_id DESC LIMIT %s OFFSET %s", (like, like, limit, offset))
    else:
        cur.execute("SELECT user_id, username, email, full_name, avatar, created_at, updated_at FROM users ORDER BY user_id DESC LIMIT %s OFFSET %s", (limit, offset))
    rows = cur.fetchall()
    for r in rows:
        av = r.get('avatar')
        if av is not None:
            try:
                r['avatar'] = base64.b64encode(av).decode('ascii')
            except Exception:
                r['avatar'] = None
    cur.close(); conn.close()
    return rows


def create_user(username: str, email: str, password_plain: str, full_name: str = None, avatar=None):
    password_hash = generate_password_hash(password_plain)
    if isinstance(avatar, str):
        try:
            avatar_bytes = base64.b64decode(avatar)
        except Exception:
            avatar_bytes = None
    else:
        avatar_bytes = avatar

    conn = get_connection()
    cur = conn.cursor()
    cur.execute("INSERT INTO users (username, email, password_hash, full_name, avatar, created_at) VALUES (%s, %s, %s, %s, %s, %s)", (username, email, password_hash, full_name, avatar_bytes, datetime.utcnow()))
    conn.commit()
    new_id = cur.lastrowid
    cur.close(); conn.close()
    return new_id


def update_user(user_id: int, data: dict):
    conn = get_connection()
    cur = conn.cursor()
    fields = []
    vals = []
    allowed = ['username', 'email', 'password', 'full_name', 'avatar']
    for k in allowed:
        if k in data:
            if k == 'password':
                pw_hash = generate_password_hash(data.get('password'))
                fields.append('password_hash=%s')
                vals.append(pw_hash)
            elif k == 'avatar':
                av = data.get('avatar')
                if isinstance(av, str):
                    try:
                        av_bytes = base64.b64decode(av)
                    except Exception:
                        av_bytes = None
                else:
                    av_bytes = av
                fields.append('avatar=%s')
                vals.append(av_bytes)
            else:
                fields.append(f"{k}=%s")
                vals.append(data.get(k))

    if not fields:
        cur.close(); conn.close()
        return False

    # updated_at handled by DB ON UPDATE
    sql = "UPDATE users SET " + ", ".join(fields) + " WHERE user_id=%s"
    vals.append(user_id)
    cur.execute(sql, tuple(vals))
    conn.commit()
    changed = cur.rowcount
    cur.close(); conn.close()
    return changed > 0


def delete_user(user_id: int):
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("DELETE FROM users WHERE user_id=%s", (user_id,))
    conn.commit()
    changed = cur.rowcount
    cur.close(); conn.close()
    return changed > 0


def verify_password(password_plain: str, password_hash: str) -> bool:
    try:
        return check_password_hash(password_hash, password_plain)
    except Exception:
        return False
