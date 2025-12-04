import mysql.connector
from config import db_config
from datetime import datetime


def get_connection():
    return mysql.connector.connect(**db_config)


def get_all(limit: int = 500, offset: int = 0):
    conn = get_connection()
    cur = conn.cursor(dictionary=True)
    cur.execute("SELECT user_id, food_id, favorited_at FROM favorites ORDER BY favorited_at DESC LIMIT %s OFFSET %s", (limit, offset))
    rows = cur.fetchall()
    cur.close(); conn.close()
    return rows


def get_by_user(user_id: int, limit: int = 500, offset: int = 0):
    conn = get_connection()
    cur = conn.cursor(dictionary=True)
    cur.execute("SELECT user_id, food_id, favorited_at FROM favorites WHERE user_id=%s ORDER BY favorited_at DESC LIMIT %s OFFSET %s", (user_id, limit, offset))
    rows = cur.fetchall()
    cur.close(); conn.close()
    return rows


def is_favorited(user_id: int, food_id: int) -> bool:
    conn = get_connection()
    cur = conn.cursor(dictionary=True)
    cur.execute("SELECT favorited_at FROM favorites WHERE user_id=%s AND food_id=%s LIMIT 1", (user_id, food_id))
    row = cur.fetchone()
    cur.close(); conn.close()
    # return the favorited_at datetime if exists, else None
    return row['favorited_at'] if row else None


def create(user_id: int, food_id: int):
    """Insert a favorite (user_id, food_id).
    Returns dict: {'created': bool, 'favorited_at': datetime}
    If already exists, returns created=False and existing favorited_at.
    """
    # check existing and return its timestamp if present
    existing_ts = is_favorited(user_id, food_id)
    if existing_ts:
        return {'created': False, 'favorited_at': existing_ts}

    ts = datetime.utcnow()
    conn = get_connection()
    cur = conn.cursor()
    cur.execute(
        "INSERT INTO favorites (user_id, food_id, favorited_at) VALUES (%s, %s, %s)",
        (user_id, food_id, ts)
    )
    conn.commit()
    cur.close(); conn.close()
    return {'created': True, 'favorited_at': ts}


def delete(user_id: int, food_id: int):
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("DELETE FROM favorites WHERE user_id=%s AND food_id=%s", (user_id, food_id))
    conn.commit()
    changed = cur.rowcount
    cur.close(); conn.close()
    return changed > 0
