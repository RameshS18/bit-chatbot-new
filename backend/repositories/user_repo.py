import sqlite3
from core.constants import DB_PATHS

class UserRepository:
    
    @staticmethod
    def save_otp(email, otp_hash, expires_at):
        with sqlite3.connect(DB_PATHS["OTP"]) as conn:
            conn.execute("DELETE FROM otp_requests WHERE email = ?", (email,))
            conn.execute("INSERT INTO otp_requests (email, otp_hash, expires_at) VALUES (?, ?, ?)", 
                         (email, otp_hash, expires_at))
    
    @staticmethod
    def verify_otp(email, otp_hash, current_time):
        with sqlite3.connect(DB_PATHS["OTP"]) as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT id FROM otp_requests WHERE email = ? AND otp_hash = ? AND expires_at > ?", 
                           (email, otp_hash, current_time))
            return cursor.fetchone()

    @staticmethod
    def get_user_by_email(email):
        with sqlite3.connect(DB_PATHS["USERS"]) as conn:
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM all_users WHERE email = ?", (email,))
            row = cursor.fetchone()
            return dict(row) if row else None

    @staticmethod
    def create_or_update_user(email, name, phone, timestamp):
        with sqlite3.connect(DB_PATHS["USERS"]) as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT id FROM all_users WHERE email = ?", (email,))
            if cursor.fetchone():
                cursor.execute("UPDATE all_users SET last_seen = ? WHERE email = ?", (timestamp, email))
                return "updated"
            else:
                cursor.execute("INSERT INTO all_users (user_name, email, phone_number, first_seen, last_seen) VALUES (?, ?, ?, ?, ?)",
                               (name, email, phone, timestamp, timestamp))
                return "created"

    @staticmethod
    def update_last_seen(email, timestamp):
        with sqlite3.connect(DB_PATHS["USERS"]) as conn:
            conn.execute("UPDATE all_users SET last_seen = ? WHERE email = ?", (timestamp, email))

    @staticmethod
    def get_all_users():
        """Fetches all users."""
        try:
            with sqlite3.connect(DB_PATHS["USERS"]) as conn:
                conn.row_factory = sqlite3.Row
                cursor = conn.execute("SELECT * FROM all_users ORDER BY last_seen DESC")
                return [dict(row) for row in cursor.fetchall()]
        except Exception as e:
            print(f"Error fetching users: {e}")
            return []

    # --- NEW: Fix for 'Today User' popup ---
    @staticmethod
    def get_today_users(date_str):
        """Fetches users active on a specific date (YYYY-MM-DD)."""
        try:
            with sqlite3.connect(DB_PATHS["USERS"]) as conn:
                conn.row_factory = sqlite3.Row
                # Use LIKE to match the date part of the timestamp string
                cursor = conn.execute("SELECT * FROM all_users WHERE last_seen LIKE ? ORDER BY last_seen DESC", (f"{date_str}%",))
                return [dict(row) for row in cursor.fetchall()]
        except Exception as e:
            print(f"Error fetching today's users: {e}")
            return []