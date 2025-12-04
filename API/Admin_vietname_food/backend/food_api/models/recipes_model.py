import mysql.connector
from config import db_config
from datetime import datetime


def get_connection():
    return mysql.connector.connect(**db_config)


def get_all(q: str = None, limit: int = 100, offset: int = 0, food_id: int = None, author_id: int = None):
    conn = get_connection()
    cur = conn.cursor(dictionary=True)
    vals = []
    sql = ("SELECT recipe_id, food_id, title, instructions, video_url, prep_time_minutes, cook_time_minutes, author_id "
           "FROM recipes")

    clauses = []
    if q:
        like = f"%{q}%"
        clauses.append("(title LIKE %s OR instructions LIKE %s)")
        vals.extend([like, like])
    if food_id is not None:
        clauses.append("food_id=%s")
        vals.append(food_id)
    if author_id is not None:
        clauses.append("author_id=%s")
        vals.append(author_id)

    if clauses:
        sql += " WHERE " + " AND ".join(clauses)

    sql += " ORDER BY recipe_id DESC LIMIT %s OFFSET %s"
    vals.extend([limit, offset])
    cur.execute(sql, tuple(vals))
    rows = cur.fetchall()
    cur.close(); conn.close()
    return rows


def get_by_id(recipe_id: int):
    conn = get_connection()
    cur = conn.cursor(dictionary=True)
    cur.execute("SELECT recipe_id, food_id, title, instructions, video_url, prep_time_minutes, cook_time_minutes, author_id FROM recipes WHERE recipe_id=%s", (recipe_id,))
    row = cur.fetchone()
    cur.close(); conn.close()
    return row


def get_by_food(food_id: int, limit: int = 100, offset: int = 0):
    return get_all(limit=limit, offset=offset, food_id=food_id)


def create(data: dict):
    # required: food_id, title, instructions
    if 'food_id' not in data or 'title' not in data or 'instructions' not in data:
        raise ValueError('food_id, title and instructions are required')
    try:
        food_id = int(data.get('food_id'))
    except Exception:
        raise ValueError('food_id must be integer')

    title = data.get('title')
    instructions = data.get('instructions')
    video_url = data.get('video_url')
    prep = data.get('prep_time_minutes')
    cook = data.get('cook_time_minutes')
    author = data.get('author_id')

    try:
        prep = int(prep) if prep is not None and prep != '' else None
    except Exception:
        prep = None
    try:
        cook = int(cook) if cook is not None and cook != '' else None
    except Exception:
        cook = None
    try:
        author = int(author) if author is not None and author != '' else None
    except Exception:
        author = None

    conn = get_connection()
    cur = conn.cursor()
    sql = ("INSERT INTO recipes (food_id, title, instructions, video_url, prep_time_minutes, cook_time_minutes, author_id) "
           "VALUES (%s, %s, %s, %s, %s, %s, %s)")
    cur.execute(sql, (food_id, title, instructions, video_url, prep, cook, author))
    conn.commit()
    new_id = cur.lastrowid
    cur.close(); conn.close()
    return new_id


def update(recipe_id: int, data: dict):
    fields = []
    vals = []
    allowed = ['food_id', 'title', 'instructions', 'video_url', 'prep_time_minutes', 'cook_time_minutes', 'author_id']
    for k in allowed:
        if k in data:
            if k in ('food_id', 'prep_time_minutes', 'cook_time_minutes', 'author_id'):
                try:
                    vals.append(int(data.get(k)))
                except Exception:
                    vals.append(None)
            else:
                vals.append(data.get(k))
            fields.append(f"{k}=%s")

    if not fields:
        return False

    sql = "UPDATE recipes SET " + ", ".join(fields) + " WHERE recipe_id=%s"
    vals.append(recipe_id)
    conn = get_connection()
    cur = conn.cursor()
    cur.execute(sql, tuple(vals))
    conn.commit()
    changed = cur.rowcount
    cur.close(); conn.close()
    return changed > 0


def delete(recipe_id: int):
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("DELETE FROM recipes WHERE recipe_id=%s", (recipe_id,))
    conn.commit()
    changed = cur.rowcount
    cur.close(); conn.close()
    return changed > 0
