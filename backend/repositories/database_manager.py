import sqlite3
import os
from core.constants import DB_PATHS

class DatabaseManager:
    """
    Handles database initialization and schema migrations.
    """
    
    @staticmethod
    def initialize_databases():
        print("--- Initializing Databases ---")
        
        # 1. User Database
        with sqlite3.connect(DB_PATHS["USERS"]) as conn:
            conn.execute("""
            CREATE TABLE IF NOT EXISTS all_users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_name TEXT,
                email TEXT,
                phone_number TEXT,
                first_seen TEXT NOT NULL,
                last_seen TEXT NOT NULL
            )
            """)

        # 2. OTP Database
        with sqlite3.connect(DB_PATHS["OTP"]) as conn:
            conn.execute("""
            CREATE TABLE IF NOT EXISTS otp_requests (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                email TEXT NOT NULL,
                otp_hash TEXT NOT NULL,
                expires_at TEXT NOT NULL
            )
            """)

        # 3. Chat History Database
        with sqlite3.connect(DB_PATHS["CHATS"]) as conn:
            conn.execute("""
            CREATE TABLE IF NOT EXISTS chat_history (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp TEXT NOT NULL,
                user_name TEXT,
                email TEXT,
                phone_number TEXT,
                user_query TEXT,
                bot_response TEXT,
                category TEXT
            )
            """)
            # Migration check for 'category' column
            try:
                conn.execute("ALTER TABLE chat_history ADD COLUMN category TEXT")
            except sqlite3.OperationalError:
                pass 

        # 4. Escalation Database
        with sqlite3.connect(DB_PATHS["ESCALATION"]) as conn:
            conn.execute("""
            CREATE TABLE IF NOT EXISTS escalated_queries (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp TEXT NOT NULL,
                user_name TEXT,
                email TEXT,
                phone_number TEXT,
                query_text TEXT NOT NULL,
                bot_response TEXT NOT NULL,
                status TEXT NOT NULL,
                remarks TEXT,
                category TEXT
            )
            """)
            try:
                conn.execute("ALTER TABLE escalated_queries ADD COLUMN category TEXT")
            except sqlite3.OperationalError:
                pass

        # 5. Staff & Logs Database
        with sqlite3.connect(DB_PATHS["STAFF"]) as conn:
            conn.execute("""
            CREATE TABLE IF NOT EXISTS staff_members (
                staff_id TEXT PRIMARY KEY,
                staff_name TEXT NOT NULL
            )
            """)
            conn.execute("""
            CREATE TABLE IF NOT EXISTS session_logs (
                session_id INTEGER PRIMARY KEY AUTOINCREMENT,
                staff_id TEXT NOT NULL,
                login_time TEXT NOT NULL,
                logout_time TEXT,
                FOREIGN KEY (staff_id) REFERENCES staff_members(staff_id)
            )
            """)
            # Insert default staff if not exists
            try:
                conn.execute("INSERT INTO staff_members (staff_id, staff_name) VALUES (?, ?)", 
                             ('BIT-STAFF-101', 'Dr. S. Ramesh'))
            except sqlite3.IntegrityError:
                pass

        with sqlite3.connect(DB_PATHS["LOGS"]) as conn:
            conn.execute("""
            CREATE TABLE IF NOT EXISTS edit_logs (
                log_id INTEGER PRIMARY KEY AUTOINCREMENT,
                staff_id TEXT NOT NULL,
                timestamp TEXT NOT NULL,
                action_performed TEXT NOT NULL,
                document_name TEXT NOT NULL
            )
            """)
            
        print("--- Databases Initialized Successfully ---")