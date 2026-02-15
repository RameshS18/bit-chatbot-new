import sqlite3
from core.constants import DB_PATHS

class ChatRepository:

    @staticmethod
    def save_chat(timestamp, user_name, email, phone, query, response, category):
        try:
            with sqlite3.connect(DB_PATHS["CHATS"]) as conn:
                conn.execute("""
                    INSERT INTO chat_history (timestamp, user_name, email, phone_number, user_query, bot_response, category)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                """, (timestamp, user_name, email, phone, query, response, category))
        except Exception as e:
            print(f"Error saving chat: {e}")

    # --- NEW: Added for Admin Dashboard ---
    @staticmethod
    def get_all_chats():
        try:
            with sqlite3.connect(DB_PATHS["CHATS"]) as conn:
                conn.row_factory = sqlite3.Row
                cursor = conn.execute("SELECT * FROM chat_history ORDER BY timestamp DESC")
                return [dict(row) for row in cursor.fetchall()]
        except Exception as e:
            print(f"Error fetching chats: {e}")
            return []