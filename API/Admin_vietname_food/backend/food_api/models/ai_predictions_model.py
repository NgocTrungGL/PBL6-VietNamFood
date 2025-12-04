import mysql.connector
from config import db_config
from datetime import datetime
import base64


def get_connection():
    return mysql.connector.connect(**db_config)


def get_all(limit: int = 100, offset: int = 0):
    conn = get_connection()
    cur = conn.cursor(dictionary=True)
    cur.execute(
        "SELECT prediction_id, user_id, uploaded_image, predicted_food_id, confidence_score, raw_prediction_data, created_at "
        "FROM ai_predictions ORDER BY prediction_id DESC LIMIT %s OFFSET %s",
        (limit, offset)
    )
    rows = cur.fetchall()
    for r in rows:
        img = r.get('uploaded_image')
        if img is not None:
            try:
                r['uploaded_image'] = base64.b64encode(img).decode('ascii')
            except Exception:
                r['uploaded_image'] = None
    cur.close(); conn.close()
    return rows


def get_by_id(prediction_id: int):
    conn = get_connection()
    cur = conn.cursor(dictionary=True)
    cur.execute(
        "SELECT prediction_id, user_id, uploaded_image, predicted_food_id, confidence_score, raw_prediction_data, created_at "
        "FROM ai_predictions WHERE prediction_id=%s",
        (prediction_id,)
    )
    row = cur.fetchone()
    if row and row.get('uploaded_image') is not None:
        try:
            row['uploaded_image'] = base64.b64encode(row['uploaded_image']).decode('ascii')
        except Exception:
            row['uploaded_image'] = None
    cur.close(); conn.close()
    return row


def get_by_user(user_id: int, limit: int = 100, offset: int = 0):
    conn = get_connection()
    cur = conn.cursor(dictionary=True)
    cur.execute(
        "SELECT prediction_id, user_id, uploaded_image, predicted_food_id, confidence_score, raw_prediction_data, created_at "
        "FROM ai_predictions WHERE user_id=%s ORDER BY prediction_id DESC LIMIT %s OFFSET %s",
        (user_id, limit, offset)
    )
    rows = cur.fetchall()
    for r in rows:
        img = r.get('uploaded_image')
        if img is not None:
            try:
                r['uploaded_image'] = base64.b64encode(img).decode('ascii')
            except Exception:
                r['uploaded_image'] = None
    cur.close(); conn.close()
    return rows


def create(data: dict):
    """
    data keys: user_id (int), uploaded_image (base64 string or bytes) optional,
    predicted_food_id (int) optional, confidence_score (float) optional,
    raw_prediction_data (str) optional
    """
    conn = get_connection()
    cur = conn.cursor()

    img = data.get('uploaded_image')
    if isinstance(img, str):
        try:
            img_bytes = base64.b64decode(img)
        except Exception:
            img_bytes = None
    else:
        img_bytes = img

    sql = ("INSERT INTO ai_predictions (user_id, uploaded_image, predicted_food_id, confidence_score, raw_prediction_data, created_at) "
           "VALUES (%s, %s, %s, %s, %s, %s)")
    vals = (
        data.get('user_id'),
        img_bytes,
        data.get('predicted_food_id'),
        data.get('confidence_score'),
        data.get('raw_prediction_data'),
        datetime.utcnow()
    )
    cur.execute(sql, vals)
    conn.commit()
    new_id = cur.lastrowid
    cur.close(); conn.close()
    return new_id


def delete(prediction_id: int):
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("DELETE FROM ai_predictions WHERE prediction_id=%s", (prediction_id,))
    conn.commit()
    changed = cur.rowcount
    cur.close(); conn.close()
    return changed > 0
