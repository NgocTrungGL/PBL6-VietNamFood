import mysql.connector
from config import db_config
from datetime import datetime
import base64


def get_connection():
    return mysql.connector.connect(**db_config)


def get_all(limit: int = 100, offset: int = 0, only_active: bool = False):
    conn = get_connection()
    cur = conn.cursor(dictionary=True)
    if only_active:
        cur.execute("SELECT banner_id, image, is_active, created_at FROM banners WHERE is_active=1 ORDER BY banner_id DESC LIMIT %s OFFSET %s", (limit, offset))
    else:
        cur.execute("SELECT banner_id, image, is_active, created_at FROM banners ORDER BY banner_id DESC LIMIT %s OFFSET %s", (limit, offset))
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


def get_by_id(banner_id: int):
    conn = get_connection()
    cur = conn.cursor(dictionary=True)
    cur.execute("SELECT banner_id, image, is_active, created_at FROM banners WHERE banner_id=%s", (banner_id,))
    row = cur.fetchone()
    if row and row.get('image') is not None:
        try:
            row['image'] = base64.b64encode(row['image']).decode('ascii')
        except Exception:
            row['image'] = None
    cur.close(); conn.close()
    return row


def create(data: dict):
    """Create banner. data keys: image (base64 string or bytes), is_active (0/1 optional)"""
    conn = get_connection()
    cur = conn.cursor()

    img = data.get('image')
    if isinstance(img, str):
        try:
            img_bytes = base64.b64decode(img)
        except Exception:
            img_bytes = None
    else:
        img_bytes = img

    is_active = data.get('is_active', 1)
    try:
        is_active = int(is_active)
    except Exception:
        is_active = 1

    sql = "INSERT INTO banners (image, is_active, created_at) VALUES (%s, %s, %s)"
    vals = (img_bytes, is_active, datetime.utcnow())
    cur.execute(sql, vals)
    conn.commit()
    new_id = cur.lastrowid
    cur.close(); conn.close()
    return new_id


def update(banner_id: int, data: dict):
    """Update banner image or is_active."""
    conn = get_connection()
    cur = conn.cursor()
    fields = []
    vals = []

    if 'image' in data:
        img = data.get('image')
        if isinstance(img, str):
            try:
                img_bytes = base64.b64decode(img)
            except Exception:
                img_bytes = None
        else:
            img_bytes = img
        fields.append('image=%s')
        vals.append(img_bytes)

    if 'is_active' in data:
        try:
            is_active = int(data.get('is_active'))
        except Exception:
            is_active = 1
        fields.append('is_active=%s')
        vals.append(is_active)

    if not fields:
        cur.close(); conn.close()
        return False

    sql = "UPDATE banners SET " + ", ".join(fields) + " WHERE banner_id=%s"
    vals.append(banner_id)
    cur.execute(sql, tuple(vals))
    conn.commit()
    changed = cur.rowcount
    cur.close(); conn.close()
    return changed > 0


def delete(banner_id: int):
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("DELETE FROM banners WHERE banner_id=%s", (banner_id,))
    conn.commit()
    changed = cur.rowcount
    cur.close(); conn.close()
    return changed > 0
