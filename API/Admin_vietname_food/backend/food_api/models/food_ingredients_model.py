import mysql.connector
from config import db_config


def get_connection():
    return mysql.connector.connect(**db_config)


def get_all(limit: int = 500, offset: int = 0, food_id: int = None, ingredient_id: int = None, is_primary: int = None):
    conn = get_connection()
    cur = conn.cursor(dictionary=True)
    sql = "SELECT food_id, ingredient_id, quantity_desc, is_primary FROM food_ingredients"
    clauses = []
    vals = []
    if food_id is not None:
        clauses.append('food_id=%s')
        vals.append(food_id)
    if ingredient_id is not None:
        clauses.append('ingredient_id=%s')
        vals.append(ingredient_id)
    if is_primary is not None:
        clauses.append('is_primary=%s')
        vals.append(1 if int(is_primary) else 0)

    if clauses:
        sql += ' WHERE ' + ' AND '.join(clauses)

    sql += ' ORDER BY food_id, ingredient_id DESC LIMIT %s OFFSET %s'
    vals.extend([limit, offset])
    cur.execute(sql, tuple(vals))
    rows = cur.fetchall()
    cur.close(); conn.close()
    # normalize boolean field to int for JSON
    for r in rows:
        r['is_primary'] = int(r.get('is_primary') or 0)
    return rows


def get_by_key(food_id: int, ingredient_id: int):
    conn = get_connection()
    cur = conn.cursor(dictionary=True)
    cur.execute("SELECT food_id, ingredient_id, quantity_desc, is_primary FROM food_ingredients WHERE food_id=%s AND ingredient_id=%s", (food_id, ingredient_id))
    row = cur.fetchone()
    cur.close(); conn.close()
    if row:
        row['is_primary'] = int(row.get('is_primary') or 0)
    return row


def exists(food_id: int, ingredient_id: int) -> bool:
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("SELECT 1 FROM food_ingredients WHERE food_id=%s AND ingredient_id=%s LIMIT 1", (food_id, ingredient_id))
    found = cur.fetchone() is not None
    cur.close(); conn.close()
    return found


def create(data: dict):
    """Create a food_ingredient relation. Returns True if inserted, False if already exists."""
    food_id = data.get('food_id')
    ingredient_id = data.get('ingredient_id')
    if food_id is None or ingredient_id is None:
        raise ValueError('food_id and ingredient_id required')
    try:
        food_id = int(food_id); ingredient_id = int(ingredient_id)
    except Exception:
        raise ValueError('food_id and ingredient_id must be integers')

    if exists(food_id, ingredient_id):
        return False

    qty = data.get('quantity_desc')
    is_primary = data.get('is_primary', 0)
    try:
        is_primary = 1 if int(is_primary) else 0
    except Exception:
        is_primary = 0

    conn = get_connection()
    cur = conn.cursor()
    cur.execute("INSERT INTO food_ingredients (food_id, ingredient_id, quantity_desc, is_primary) VALUES (%s, %s, %s, %s)", (food_id, ingredient_id, qty, is_primary))
    conn.commit()
    cur.close(); conn.close()
    return True


def update(food_id: int, ingredient_id: int, data: dict):
    fields = []
    vals = []
    if 'quantity_desc' in data:
        fields.append('quantity_desc=%s'); vals.append(data.get('quantity_desc'))
    if 'is_primary' in data:
        try:
            vals.append(1 if int(data.get('is_primary')) else 0)
        except Exception:
            vals.append(0)
        fields.append('is_primary=%s')

    if not fields:
        return False

    conn = get_connection()
    cur = conn.cursor()
    sql = 'UPDATE food_ingredients SET ' + ', '.join(fields) + ' WHERE food_id=%s AND ingredient_id=%s'
    vals.extend([food_id, ingredient_id])
    cur.execute(sql, tuple(vals))
    conn.commit()
    changed = cur.rowcount
    cur.close(); conn.close()
    return changed > 0


def delete(food_id: int, ingredient_id: int):
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("DELETE FROM food_ingredients WHERE food_id=%s AND ingredient_id=%s", (food_id, ingredient_id))
    conn.commit()
    changed = cur.rowcount
    cur.close(); conn.close()
    return changed > 0
