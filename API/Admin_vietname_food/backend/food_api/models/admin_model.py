import mysql.connector
from config import db_config
from datetime import datetime

# Using werkzeug.security for password hashing (Flask dependency)
from werkzeug.security import generate_password_hash, check_password_hash


def get_connection():
    return mysql.connector.connect(**db_config)


def find_by_email(email: str):
    """Return admin row by email or None."""
    conn = get_connection()
    cur = conn.cursor(dictionary=True)
    cur.execute("SELECT admin_id, username, email, password, full_name, created_at, updated_at FROM admin WHERE email=%s", (email,))
    row = cur.fetchone()
    cur.close(); conn.close()
    return row


def find_by_username(username: str):
    """Return admin row by username or None."""
    conn = get_connection()
    cur = conn.cursor(dictionary=True)
    cur.execute("SELECT admin_id, username, email, password, full_name, created_at, updated_at FROM admin WHERE username=%s", (username,))
    row = cur.fetchone()
    cur.close(); conn.close()
    return row


def find_by_id(admin_id: int):
    """Return admin row by id or None."""
    conn = get_connection()
    cur = conn.cursor(dictionary=True)
    cur.execute("SELECT admin_id, username, email, password, full_name, created_at, updated_at FROM admin WHERE admin_id=%s", (admin_id,))
    row = cur.fetchone()
    cur.close(); conn.close()
    return row


def create_admin(username: str, email: str, password_plain: str, full_name: str):
    """Create a new admin and return new id."""
    password_hash = generate_password_hash(password_plain)
    conn = get_connection()
    cur = conn.cursor()
    cur.execute(
        "INSERT INTO admin (username, email, password, full_name, created_at) VALUES (%s, %s, %s, %s, %s)",
        (username, email, password_hash, full_name, datetime.utcnow())
    )
    conn.commit()
    new_id = cur.lastrowid
    cur.close(); conn.close()
    return new_id


def update_password(admin_id: int, new_password_plain: str):
    """Update password for given admin id."""
    password_hash = generate_password_hash(new_password_plain)
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("UPDATE admin SET password=%s, updated_at=%s WHERE admin_id=%s", (password_hash, datetime.utcnow(), admin_id))
    conn.commit()
    affected = cur.rowcount
    cur.close(); conn.close()
    return affected > 0


def verify_password(password_plain: str, password_hash: str) -> bool:
    try:
        return check_password_hash(password_hash, password_plain)
    except Exception:
        return False
