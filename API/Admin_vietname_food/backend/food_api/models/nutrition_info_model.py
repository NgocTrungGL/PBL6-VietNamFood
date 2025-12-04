import mysql.connector
from config import db_config
from datetime import datetime


def get_connection():
    return mysql.connector.connect(**db_config)


def get_all(limit: int = 100, offset: int = 0):
    conn = get_connection()
    cur = conn.cursor(dictionary=True)
    cur.execute("SELECT food_id, serving_size, calories, protein, carbs, fat FROM nutrition_info ORDER BY food_id DESC LIMIT %s OFFSET %s", (limit, offset))
    rows = cur.fetchall()
    cur.close(); conn.close()
    return rows


def get_by_id(food_id: int):
    conn = get_connection()
    cur = conn.cursor(dictionary=True)
    cur.execute("SELECT food_id, serving_size, calories, protein, carbs, fat FROM nutrition_info WHERE food_id=%s", (food_id,))
    row = cur.fetchone()
    cur.close(); conn.close()
    return row


def exists(food_id: int) -> bool:
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("SELECT 1 FROM nutrition_info WHERE food_id=%s LIMIT 1", (food_id,))
    found = cur.fetchone() is not None
    cur.close(); conn.close()
    return found


def create(data: dict):
    """Create nutrition info for a food. Expects food_id to be present (one-to-one with foods). Returns True if inserted."""
    food_id = data.get('food_id')
    if food_id is None:
        raise ValueError('food_id required')
    try:
        food_id = int(food_id)
    except Exception:
        raise ValueError('food_id must be integer')

    # allow creating only once
    if exists(food_id):
        return False

    serving_size = data.get('serving_size')
    def _to_float(key):
        v = data.get(key)
        if v is None or v == '':
            return None
        try:
            return float(v)
        except Exception:
            return None

    calories = _to_float('calories')
    protein = _to_float('protein')
    carbs = _to_float('carbs')
    fat = _to_float('fat')

    conn = get_connection()
    cur = conn.cursor()
    sql = "INSERT INTO nutrition_info (food_id, serving_size, calories, protein, carbs, fat) VALUES (%s, %s, %s, %s, %s, %s)"
    cur.execute(sql, (food_id, serving_size, calories, protein, carbs, fat))
    conn.commit()
    cur.close(); conn.close()
    return True


def update(food_id: int, data: dict):
    # Build dynamic set clause depending on provided fields
    fields = []
    vals = []
    if 'serving_size' in data:
        fields.append('serving_size=%s'); vals.append(data.get('serving_size'))
    for key in ('calories', 'protein', 'carbs', 'fat'):
        if key in data:
            try:
                vals.append(float(data.get(key)))
            except Exception:
                vals.append(None)
            fields.append(f"{key}=%s")

    if not fields:
        return False

    conn = get_connection()
    cur = conn.cursor()
    sql = 'UPDATE nutrition_info SET ' + ', '.join(fields) + ' WHERE food_id=%s'
    vals.append(food_id)
    cur.execute(sql, tuple(vals))
    conn.commit()
    changed = cur.rowcount
    cur.close(); conn.close()
    return changed > 0


def delete(food_id: int):
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("DELETE FROM nutrition_info WHERE food_id=%s", (food_id,))
    conn.commit()
    changed = cur.rowcount
    cur.close(); conn.close()
    return changed > 0
