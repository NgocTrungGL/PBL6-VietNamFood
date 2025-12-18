import mysql.connector
from config import db_config
from datetime import datetime
import base64


def get_connection():
    return mysql.connector.connect(**db_config)


def get_all(limit: int = 100, offset: int = 0):
    conn = get_connection()
    cur = conn.cursor(dictionary=True)

    # 👇 Cập nhật query: Thêm nutrition_info và ingredients
    query = """
    SELECT
        food_id,
        category_id,
        name,
        description,
        nutrition_info,   -- Cột mới (TEXT)
        ingredients,      -- Cột mới (TEXT)
        main_image,       -- Dạng TEXT/URL
        origin_region_id,
        avg_rating,
        most_popular,
        created_at,
        updated_at,
        label_id
    FROM foods
    ORDER BY food_id DESC
    LIMIT %s OFFSET %s
    """

    cur.execute(query, (limit, offset))
    rows = cur.fetchall()

    # Vì main_image là URL (TEXT) nên không cần decode Base64 nữa
    # nutrition_info và ingredients trả về dạng string raw,
    # Frontend (React Native) sẽ tự .split() để hiển thị.

    cur.close()
    conn.close()

    return rows




def search(query: str, limit: int = 100, offset: int = 0):
    conn = get_connection()
    cur = conn.cursor(dictionary=True)
    like = f"%{query}%"
    sql = ("SELECT food_id, category_id, name, description, main_image, origin_region_id, avg_rating, most_popular, created_at, updated_at "
           "FROM foods WHERE name LIKE %s OR description LIKE %s "
           "ORDER BY food_id DESC LIMIT %s OFFSET %s")
    cur.execute(sql, (like, like, limit, offset))
    rows = cur.fetchall()
    # Encode main_image
    for r in rows:
        mi = r.get('main_image')
        if mi is not None:
            try:
                r['main_image'] = base64.b64encode(mi).decode('ascii')
            except Exception:
                r['main_image'] = None
    cur.close(); conn.close()
    return rows


def get_by_id(food_id: int):
    conn = get_connection()
    cur = conn.cursor(dictionary=True)
    try:
        cur.execute("SELECT food_id, category_id, name, description, main_image, origin_region_id, avg_rating, most_popular, created_at, updated_at, label_id FROM foods WHERE food_id=%s", (food_id,))
        row = cur.fetchone()

        if row:
            image_data = row.get('main_image')

            if image_data is not None:
                # TRƯỜNG HỢP 1: Dữ liệu là Bytes (BLOB lưu trong DB) -> Cần convert sang Base64
                if isinstance(image_data, bytes):
                    try:
                        # decode('utf-8') là chuẩn nhất để biến bytes thành string JSON
                        row['main_image'] = base64.b64encode(image_data).decode('utf-8')
                    except Exception as e:
                        print(f"Error encoding image for food {food_id}: {e}")
                        row['main_image'] = None

                # TRƯỜNG HỢP 2: Dữ liệu là String (URL ảnh hoặc Base64 đã lưu dạng text)
                elif isinstance(image_data, str):
                    # Giữ nguyên, chỉ xóa khoảng trắng thừa nếu có
                    row['main_image'] = image_data.strip()

        return row

    except Exception as e:
        print(f"Error in get_by_id: {e}")
        return None

    finally:
        # Đóng kết nối trong finally để đảm bảo luôn chạy dù có lỗi hay không
        cur.close()
        conn.close()


def create(data: dict):
    conn = get_connection()
    cur = conn.cursor()
    sql = ("INSERT INTO foods (category_id, name, description, main_image, origin_region_id, avg_rating, most_popular, created_at) "
           "VALUES (%s, %s, %s, %s, %s, %s, %s, %s)")
    # Accept main_image as base64 string or bytes; convert to bytes for DB
    mi = data.get('main_image')
    if isinstance(mi, str):
        try:
            mi_bytes = base64.b64decode(mi)
        except Exception:
            mi_bytes = None
    else:
        mi_bytes = mi

    vals = (
        data.get('category_id'),
        data.get('name'),
        data.get('description'),
        mi_bytes,
        data.get('origin_region_id'),
        data.get('avg_rating'),
        data.get('most_popular'),
        datetime.utcnow()
    )
    cur.execute(sql, vals)
    conn.commit()
    new_id = cur.lastrowid
    cur.close(); conn.close()
    return new_id


def update(food_id: int, data: dict):
    conn = get_connection()
    cur = conn.cursor()
    # Build dynamic set clause depending on provided fields
    fields = []
    vals = []
    allowed = ['category_id', 'name', 'description', 'main_image', 'origin_region_id', 'avg_rating', 'most_popular']
    for k in allowed:
        if k in data:
            if k == 'main_image':
                mi = data.get('main_image')
                if isinstance(mi, str):
                    try:
                        mi_bytes = base64.b64decode(mi)
                    except Exception:
                        mi_bytes = None
                else:
                    mi_bytes = mi
                fields.append(f"{k}=%s")
                vals.append(mi_bytes)
            else:
                fields.append(f"{k}=%s")
                vals.append(data.get(k))

    # always update updated_at
    fields.append("updated_at=%s")
    vals.append(datetime.utcnow())

    if not fields:
        cur.close(); conn.close()
        return False

    sql = "UPDATE foods SET " + ", ".join(fields) + " WHERE food_id=%s"
    vals.append(food_id)
    cur.execute(sql, tuple(vals))
    conn.commit()
    changed = cur.rowcount
    cur.close(); conn.close()
    return changed > 0


def delete(food_id: int):
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("DELETE FROM foods WHERE food_id=%s", (food_id,))
    conn.commit()
    changed = cur.rowcount
    cur.close(); conn.close()
    return changed > 0
