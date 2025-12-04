import mysql.connector
from config import db_config
from datetime import datetime


def get_connection():
    return mysql.connector.connect(**db_config)


def get_all(limit: int = 100, offset: int = 0, user_id: int = None, food_id: int = None, q: str = None):
    conn = get_connection()
    cur = conn.cursor(dictionary=True)
    sql = "SELECT review_id, user_id, food_id, rating, comment, created_at FROM reviews"
    clauses = []
    vals = []
    if user_id is not None:
        clauses.append('user_id=%s'); vals.append(user_id)
    if food_id is not None:
        clauses.append('food_id=%s'); vals.append(food_id)
    if q:
        like = f"%{q}%"
        clauses.append('(comment LIKE %s)'); vals.append(like)
    if clauses:
        sql += ' WHERE ' + ' AND '.join(clauses)
    sql += ' ORDER BY created_at DESC LIMIT %s OFFSET %s'
    vals.extend([limit, offset])
    cur.execute(sql, tuple(vals))
    rows = cur.fetchall()
    cur.close(); conn.close()
    return rows


def get_all_by_food_id(food_id: int):
    """
    Lấy tất cả review của một món ăn, KÈM THEO thông tin user (tên, avatar).
    """
    conn = get_connection()
    cur = conn.cursor(dictionary=True)

    # Sử dụng JOIN để lấy thông tin từ bảng users
    query = """
        SELECT
            r.review_id,
            r.user_id,
            r.food_id,
            r.rating,
            r.comment,
            r.created_at,
            u.full_name AS user_name,  -- Lấy tên user, đổi tên thành user_name cho frontend dễ dùng
            u.avatar AS user_avatar    -- Lấy avatar user
        FROM reviews r
        JOIN users u ON r.user_id = u.user_id
        WHERE r.food_id = %s
        ORDER BY r.created_at DESC
    """

    cur.execute(query, (food_id,))

    rows = cur.fetchall()

    cur.close()
    conn.close()

    return rows



def get_by_user(user_id: int, limit: int = 100, offset: int = 0):
    return get_all(limit=limit, offset=offset, user_id=user_id)


def get_by_food(food_id: int, limit: int = 100, offset: int = 0):
    return get_all(limit=limit, offset=offset, food_id=food_id)


def exists_by_user_food(user_id: int, food_id: int):
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("SELECT review_id, created_at FROM reviews WHERE user_id=%s AND food_id=%s LIMIT 1", (user_id, food_id))
    row = cur.fetchone()
    cur.close(); conn.close()
    if row:
        return {'review_id': row[0], 'created_at': row[1]}
    return None


def create(data: dict):
    # required user_id, food_id, rating
    if 'user_id' not in data or 'food_id' not in data or 'rating' not in data:
        raise ValueError('user_id, food_id and rating are required')
    try:
        user_id = int(data.get('user_id'))
        food_id = int(data.get('food_id'))
        rating = int(data.get('rating'))
    except Exception:
        raise ValueError('user_id, food_id and rating must be integers')
    if rating < 1 or rating > 5:
        raise ValueError('rating must be between 1 and 5')

    # check unique
    ex = exists_by_user_food(user_id, food_id)
    if ex:
        return {'created': False, 'review_id': ex['review_id'], 'created_at': ex['created_at']}

    comment = data.get('comment')
    ts = datetime.utcnow()
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("INSERT INTO reviews (user_id, food_id, rating, comment, created_at) VALUES (%s, %s, %s, %s, %s)", (user_id, food_id, rating, comment, ts))
    conn.commit()
    new_id = cur.lastrowid
    cur.close(); conn.close()
    return {'created': True, 'review_id': new_id, 'created_at': ts}


def update(review_id: int, data: dict):
    fields = []
    vals = []
    if 'rating' in data:
        try:
            r = int(data.get('rating'))
            if r < 1 or r > 5:
                raise ValueError('rating must be between 1 and 5')
            fields.append('rating=%s'); vals.append(r)
        except Exception:
            raise ValueError('rating must be integer between 1 and 5')
    if 'comment' in data:
        fields.append('comment=%s'); vals.append(data.get('comment'))

    if not fields:
        return False

    conn = get_connection()
    cur = conn.cursor()
    sql = 'UPDATE reviews SET ' + ', '.join(fields) + ' WHERE review_id=%s'
    vals.append(review_id)
    cur.execute(sql, tuple(vals))
    conn.commit()
    changed = cur.rowcount
    cur.close(); conn.close()
    return changed > 0


def delete(review_id: int):
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("DELETE FROM reviews WHERE review_id=%s", (review_id,))
    conn.commit()
    changed = cur.rowcount
    cur.close(); conn.close()
    return changed > 0
