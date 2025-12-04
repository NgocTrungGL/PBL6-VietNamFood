import mysql.connector
from config import db_config
import base64


def get_connection():
    return mysql.connector.connect(**db_config)


def get_all(limit: int = 100, offset: int = 0, parent_region_id: int = None, q: str = None):
    conn = get_connection()
    cur = conn.cursor(dictionary=True)
    sql = "SELECT region_id, region_name, region_image, description, parent_image, parent_region_id FROM regions"
    clauses = []
    vals = []
    if parent_region_id is not None:
        clauses.append('parent_region_id=%s')
        vals.append(parent_region_id)
    if q:
        like = f"%{q}%"
        clauses.append('(region_name LIKE %s OR description LIKE %s)')
        vals.extend([like, like])

    if clauses:
        sql += ' WHERE ' + ' AND '.join(clauses)

    sql += ' ORDER BY region_id DESC LIMIT %s OFFSET %s'
    vals.extend([limit, offset])
    cur.execute(sql, tuple(vals))
    rows = cur.fetchall()
    for r in rows:
        ri = r.get('region_image')
        if ri is not None:
            try:
                r['region_image'] = base64.b64encode(ri).decode('ascii')
            except Exception:
                r['region_image'] = None
        pi = r.get('parent_image')
        if pi is not None:
            try:
                r['parent_image'] = base64.b64encode(pi).decode('ascii')
            except Exception:
                r['parent_image'] = None
    cur.close(); conn.close()
    return rows


def get_by_id(region_id: int):
    conn = get_connection()
    cur = conn.cursor(dictionary=True)
    cur.execute("SELECT region_id, region_name, region_image, description, parent_image, parent_region_id FROM regions WHERE region_id=%s", (region_id,))
    row = cur.fetchone()
    if row:
        ri = row.get('region_image')
        if ri is not None:
            try:
                row['region_image'] = base64.b64encode(ri).decode('ascii')
            except Exception:
                row['region_image'] = None
        pi = row.get('parent_image')
        if pi is not None:
            try:
                row['parent_image'] = base64.b64encode(pi).decode('ascii')
            except Exception:
                row['parent_image'] = None
    cur.close(); conn.close()
    return row


def create(data: dict):
    conn = get_connection()
    cur = conn.cursor()

    name = data.get('region_name')
    if not name:
        raise ValueError('region_name is required')

    ri = data.get('region_image')
    if isinstance(ri, str):
        try:
            ri_bytes = base64.b64decode(ri)
        except Exception:
            ri_bytes = None
    else:
        ri_bytes = ri

    pi = data.get('parent_image')
    if isinstance(pi, str):
        try:
            pi_bytes = base64.b64decode(pi)
        except Exception:
            pi_bytes = None
    else:
        pi_bytes = pi

    desc = data.get('description')
    parent_id = data.get('parent_region_id')
    try:
        parent_id = int(parent_id) if parent_id is not None and parent_id != '' else None
    except Exception:
        parent_id = None

    sql = "INSERT INTO regions (region_name, region_image, description, parent_image, parent_region_id) VALUES (%s, %s, %s, %s, %s)"
    vals = (name, ri_bytes, desc, pi_bytes, parent_id)
    cur.execute(sql, vals)
    conn.commit()
    new_id = cur.lastrowid
    cur.close(); conn.close()
    return new_id


def update(region_id: int, data: dict):
    conn = get_connection()
    cur = conn.cursor()
    fields = []
    vals = []
    if 'region_name' in data:
        fields.append('region_name=%s'); vals.append(data.get('region_name'))
    if 'region_image' in data:
        ri = data.get('region_image')
        if isinstance(ri, str):
            try:
                ri_bytes = base64.b64decode(ri)
            except Exception:
                ri_bytes = None
        else:
            ri_bytes = ri
        fields.append('region_image=%s'); vals.append(ri_bytes)
    if 'description' in data:
        fields.append('description=%s'); vals.append(data.get('description'))
    if 'parent_image' in data:
        pi = data.get('parent_image')
        if isinstance(pi, str):
            try:
                pi_bytes = base64.b64decode(pi)
            except Exception:
                pi_bytes = None
        else:
            pi_bytes = pi
        fields.append('parent_image=%s'); vals.append(pi_bytes)
    if 'parent_region_id' in data:
        try:
            pid = int(data.get('parent_region_id'))
        except Exception:
            pid = None
        fields.append('parent_region_id=%s'); vals.append(pid)

    if not fields:
        cur.close(); conn.close()
        return False

    sql = 'UPDATE regions SET ' + ', '.join(fields) + ' WHERE region_id=%s'
    vals.append(region_id)
    cur.execute(sql, tuple(vals))
    conn.commit()
    changed = cur.rowcount
    cur.close(); conn.close()
    return changed > 0


def delete(region_id: int):
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("DELETE FROM regions WHERE region_id=%s", (region_id,))
    conn.commit()
    changed = cur.rowcount
    cur.close(); conn.close()
    return changed > 0
