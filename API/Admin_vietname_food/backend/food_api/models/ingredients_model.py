import mysql.connector
from config import db_config
from datetime import datetime
import base64


def get_connection():
    return mysql.connector.connect(**db_config)


def get_all(limit: int = 100, offset: int = 0):
    conn = get_connection()
    cur = conn.cursor(dictionary=True)
    cur.execute("SELECT ingredient_id, name, image FROM ingredients ORDER BY ingredient_id DESC LIMIT %s OFFSET %s", (limit, offset))
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
    sql = ("SELECT ingredient_id, name, image FROM ingredients "
           "WHERE name LIKE %s "
           "ORDER BY ingredient_id DESC LIMIT %s OFFSET %s")
    cur.execute(sql, (like, limit, offset))
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


def get_by_id(ingredient_id: int):
    conn = get_connection()
    cur = conn.cursor(dictionary=True)
    cur.execute("SELECT ingredient_id, name, image FROM ingredients WHERE ingredient_id=%s", (ingredient_id,))
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
    img = data.get('image')
    if isinstance(img, str):
        try:
            img_bytes = base64.b64decode(img)
        except Exception:
            img_bytes = None
    else:
        img_bytes = img

    sql = "INSERT INTO ingredients (name, image) VALUES (%s, %s)"
    cur.execute(sql, (data.get('name'), img_bytes))
    conn.commit()
    new_id = cur.lastrowid
    cur.close(); conn.close()
    return new_id


def update(ingredient_id: int, data: dict):
    conn = get_connection()
    cur = conn.cursor()
    fields = []
    vals = []
    allowed = ['name', 'image']
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

    sql = "UPDATE ingredients SET " + ", ".join(fields) + " WHERE ingredient_id=%s"
    vals.append(ingredient_id)
    cur.execute(sql, tuple(vals))
    conn.commit()
    changed = cur.rowcount
    cur.close(); conn.close()
    return changed > 0


def delete(ingredient_id: int):
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("DELETE FROM ingredients WHERE ingredient_id=%s", (ingredient_id,))
    conn.commit()
    changed = cur.rowcount
    cur.close(); conn.close()
    return changed > 0
