import sqlite3
from core.constants import DB_PATHS

class StaffRepository:

    @staticmethod
    def get_staff(staff_id):
        with sqlite3.connect(DB_PATHS["STAFF"]) as conn:
            conn.row_factory = sqlite3.Row
            cursor = conn.execute("SELECT * FROM staff_members WHERE staff_id = ?", (staff_id,))
            return dict(cursor.fetchone()) if cursor.fetchone() else None

    @staticmethod
    def create_staff(staff_id, staff_name):
        with sqlite3.connect(DB_PATHS["STAFF"]) as conn:
            conn.execute("INSERT INTO staff_members (staff_id, staff_name) VALUES (?, ?)", (staff_id, staff_name))

    @staticmethod
    def create_session(staff_id, login_time):
        with sqlite3.connect(DB_PATHS["STAFF"]) as conn:
            cursor = conn.execute("INSERT INTO session_logs (staff_id, login_time) VALUES (?, ?)", (staff_id, login_time))
            return cursor.lastrowid

    @staticmethod
    def close_session(session_id, logout_time):
        with sqlite3.connect(DB_PATHS["STAFF"]) as conn:
            conn.execute("UPDATE session_logs SET logout_time = ? WHERE session_id = ?", (logout_time, session_id))

    @staticmethod
    def log_action(staff_id, timestamp, action, document_name):
        with sqlite3.connect(DB_PATHS["LOGS"]) as conn:
            conn.execute("INSERT INTO edit_logs (staff_id, timestamp, action_performed, document_name) VALUES (?, ?, ?, ?)",
                         (staff_id, timestamp, action, document_name))