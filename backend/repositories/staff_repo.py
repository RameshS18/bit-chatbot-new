import sqlite3
from datetime import datetime, timedelta
import pytz
from core.constants import DB_PATHS

IST = pytz.timezone('Asia/Kolkata')

class StaffRepository:

    @staticmethod
    def get_staff(staff_id):
        with sqlite3.connect(DB_PATHS["STAFF"]) as conn:
            conn.row_factory = sqlite3.Row
            cursor = conn.execute("SELECT * FROM staff_members WHERE staff_id = ?", (staff_id,))
            row = cursor.fetchone()
            return dict(row) if row else None
            # return dict(cursor.fetchone()) if cursor.fetchone() else None

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

    # --- NEW METHODS FOR ADMIN DASHBOARD ---

    @staticmethod
    def get_staff_with_login():
        """Returns all staff with their last login time."""
        try:
            with sqlite3.connect(DB_PATHS["STAFF"]) as conn:
                conn.row_factory = sqlite3.Row
                cursor = conn.execute("""
                    SELECT 
                        s.staff_id, 
                        s.staff_name, 
                        MAX(sl.login_time) as last_login
                    FROM staff_members s
                    LEFT JOIN session_logs sl ON s.staff_id = sl.staff_id
                    GROUP BY s.staff_id, s.staff_name
                    ORDER BY s.staff_name ASC
                """)
                return [dict(row) for row in cursor.fetchall()]
        except Exception as e:
            print(f"Error fetching staff: {e}")
            return []

    @staticmethod
    def get_detailed_logs(search_term, filter_period):
        """Fetches logs with search and date filtering."""
        try:
            # We need to attach the staff database to the logs database to join them
            conn = sqlite3.connect(DB_PATHS["LOGS"])
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()
            
            # Attach Staff DB
            cursor.execute("ATTACH DATABASE ? AS editor_staff", (DB_PATHS["STAFF"],))
            
            query = """
                SELECT 
                    el.log_id,
                    el.timestamp,
                    el.staff_id,
                    es.staff_name,
                    el.action_performed,
                    el.document_name
                FROM main.edit_logs el
                LEFT JOIN editor_staff.staff_members es ON el.staff_id = es.staff_id
                WHERE (IFNULL(es.staff_name, '') LIKE ? OR el.staff_id LIKE ?)
            """
            params = [f'%{search_term}%', f'%{search_term}%']
            
            # Date Logic
            if filter_period == '10days':
                cutoff = (datetime.now(IST) - timedelta(days=10)).isoformat()
                query += " AND el.timestamp >= ?"
                params.append(cutoff)
            elif filter_period == '30days':
                cutoff = (datetime.now(IST) - timedelta(days=30)).isoformat()
                query += " AND el.timestamp >= ?"
                params.append(cutoff)
                
            query += " ORDER BY el.timestamp DESC"
            
            cursor.execute(query, tuple(params))
            logs = [dict(row) for row in cursor.fetchall()]
            
            # Detach and Close
            cursor.execute("DETACH DATABASE editor_staff")
            conn.close()
            return logs
        except Exception as e:
            print(f"Error fetching logs: {e}")
            return []