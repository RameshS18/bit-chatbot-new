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
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM all_users WHERE email = ?", (email,))
            return cursor.fetchone()

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