import mysql.connector
from config import db_config
from datetime import datetime
import base64


def get_connection():
    return mysql.connector.connect(**db_config)


def get_all(limit: int = 100, offset: int = 0):
    conn = get_connection()
    cur = conn.cursor(dictionary=True)
    cur.execute("SELECT category_id, category_name, description, image, created_at FROM categories ORDER BY category_id DESC LIMIT %s OFFSET %s", (limit, offset))
    rows = cur.fetchall()
    for r in rows:
        img = r.get('image')
        if img is not None:
            try:
                r['image'] = base64.b64encode(img).decode('ascii')
            except Exception:
                r['image'] = None
    cur.close(); conn.close()
    return rows


def search(query: str, limit: int = 100, offset: int = 0):
    conn = get_connection()
    cur = conn.cursor(dictionary=True)
    like = f"%{query}%"
    sql = ("SELECT category_id, category_name, description, image, created_at "
           "FROM categories WHERE category_name LIKE %s OR description LIKE %s "
           "ORDER BY category_id DESC LIMIT %s OFFSET %s")
    cur.execute(sql, (like, like, limit, offset))
    rows = cur.fetchall()
    for r in rows:
        img = r.get('image')
        if img is not None:
            try:
                r['image'] = base64.b64encode(img).decode('ascii')
            except Exception:
                r['image'] = None
    cur.close(); conn.close()
    return rows


def get_by_id(category_id: int):
    conn = get_connection()
    cur = conn.cursor(dictionary=True)
    cur.execute("SELECT category_id, category_name, description, image, created_at FROM categories WHERE category_id=%s", (category_id,))
    row = cur.fetchone()
    if row and row.get('image') is not None:
        try:
            row['image'] = base64.b64encode(row['image']).decode('ascii')
        except Exception:
            row['image'] = None
    cur.close(); conn.close()
    return row


def create(data: dict):
    conn = get_connection()
    cur = conn.cursor()
    sql = "INSERT INTO categories (category_name, description, image, created_at) VALUES (%s, %s, %s, %s)"

    img = data.get('image')
    if isinstance(img, str):
        try:
            img_bytes = base64.b64decode(img)
        except Exception:
            img_bytes = None
    else:
        img_bytes = img

    vals = (data.get('category_name'), data.get('description'), img_bytes, datetime.utcnow())
    cur.execute(sql, vals)
    conn.commit()
    new_id = cur.lastrowid
    cur.close(); conn.close()
    return new_id


def update(category_id: int, data: dict):
    conn = get_connection()
    cur = conn.cursor()
    fields = []
    vals = []
    allowed = ['category_name', 'description', 'image']
    for k in allowed:
        if k in data:
            if k == 'image':
                img = data.get('image')
                if isinstance(img, str):
                    try:
                        img_bytes = base64.b64decode(img)
                    except Exception:
                        img_bytes = None
                else:
                    img_bytes = img
                fields.append(f"{k}=%s")
                vals.append(img_bytes)
            else:
                fields.append(f"{k}=%s")
                vals.append(data.get(k))

    if not fields:
        cur.close(); conn.close()
        return False

    fields.append("created_at=created_at")
    fields.append("updated_at=%s")
    vals.append(datetime.utcnow())

    sql = "UPDATE categories SET " + ", ".join(fields) + " WHERE category_id=%s"
    vals.append(category_id)
    cur.execute(sql, tuple(vals))
    conn.commit()
    changed = cur.rowcount
    cur.close(); conn.close()
    return changed > 0


def delete(category_id: int):
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("DELETE FROM categories WHERE category_id=%s", (category_id,))
    conn.commit()
    changed = cur.rowcount
    cur.close(); conn.close()
    return changed > 0
