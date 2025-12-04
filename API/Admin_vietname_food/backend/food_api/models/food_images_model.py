import mysql.connector
from config import db_config
from datetime import datetime
import base64


def get_connection():
    return mysql.connector.connect(**db_config)


def get_all(limit: int = 100, offset: int = 0, food_id: int = None):
    conn = get_connection()
    cur = conn.cursor(dictionary=True)
    if food_id is not None:
        cur.execute("SELECT image_id, food_id, image_data, caption, created_at FROM food_images WHERE food_id=%s ORDER BY image_id DESC LIMIT %s OFFSET %s", (food_id, limit, offset))
    else:
        cur.execute("SELECT image_id, food_id, image_data, caption, created_at FROM food_images ORDER BY image_id DESC LIMIT %s OFFSET %s", (limit, offset))
    rows = cur.fetchall()
    for r in rows:
        img = r.get('image_data')
        if img is not None:
            try:
                r['image_data'] = base64.b64encode(img).decode('ascii')
            except Exception:
                r['image_data'] = None
    cur.close(); conn.close()
    return rows


def get_all_by_food_id(food_id: int):
    """
    Lấy tất cả ảnh của một món ăn theo food_id.
    Trả về danh sách dict, image_data có thể là URL hoặc base64 (nếu lưu BLOB)
    """
    conn = get_connection()
    cur = conn.cursor(dictionary=True)

    cur.execute(
        "SELECT image_id, food_id, image_data, caption, created_at FROM food_images WHERE food_id = %s ORDER BY image_id ASC",
        (food_id,)
    )
    rows = cur.fetchall()

    for row in rows:
        if row.get('image_data') is not None:
            if isinstance(row['image_data'], (bytes, bytearray)):
                try:
                    row['image_data'] = base64.b64encode(row['image_data']).decode('ascii')
                except Exception:
                    row['image_data'] = None
            # nếu là str (URL) thì giữ nguyên

    cur.close()
    conn.close()

    return rows




def get_by_food(food_id: int, limit: int = 100, offset: int = 0):
    return get_all(limit=limit, offset=offset, food_id=food_id)


def create(data: dict):
    """data keys: food_id (int), image_data (base64 string or bytes), caption (optional)
    Returns new image_id.
    """
    conn = get_connection()
    cur = conn.cursor()

    if 'food_id' not in data:
        raise ValueError('food_id is required')

    food_id = data.get('food_id')
    try:
        food_id = int(food_id)
    except Exception:
        raise ValueError('food_id must be an integer')

    img = data.get('image_data')
    if isinstance(img, str):
        try:
            img_bytes = base64.b64decode(img)
        except Exception:
            img_bytes = None
    else:
        img_bytes = img

    caption = data.get('caption')

    sql = "INSERT INTO food_images (food_id, image_data, caption, created_at) VALUES (%s, %s, %s, %s)"
    vals = (food_id, img_bytes, caption, datetime.utcnow())
    cur.execute(sql, vals)
    conn.commit()
    new_id = cur.lastrowid
    cur.close(); conn.close()
    return new_id


def update(image_id: int, data: dict):
    conn = get_connection()
    cur = conn.cursor()
    fields = []
    vals = []

    if 'image_data' in data:
        img = data.get('image_data')
        if isinstance(img, str):
            try:
                img_bytes = base64.b64decode(img)
            except Exception:
                img_bytes = None
        else:
            img_bytes = img
        fields.append('image_data=%s')
        vals.append(img_bytes)

    if 'caption' in data:
        fields.append('caption=%s')
        vals.append(data.get('caption'))

    if not fields:
        cur.close(); conn.close()
        return False

    # always update created_at? keep original created_at
    sql = "UPDATE food_images SET " + ", ".join(fields) + " WHERE image_id=%s"
    vals.append(image_id)
    cur.execute(sql, tuple(vals))
    conn.commit()
    changed = cur.rowcount
    cur.close(); conn.close()
    return changed > 0


def delete(image_id: int):
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("DELETE FROM food_images WHERE image_id=%s", (image_id,))
    conn.commit()
    changed = cur.rowcount
    cur.close(); conn.close()
    return changed > 0
