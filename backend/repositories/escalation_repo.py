import sqlite3
from core.constants import DB_PATHS

class EscalationRepository:

    @staticmethod
    def add_escalation(timestamp, user_name, email, phone, query, response, category):
        try:
            with sqlite3.connect(DB_PATHS["ESCALATION"]) as conn:
                conn.execute("""
                    INSERT INTO escalated_queries (timestamp, user_name, email, phone_number, query_text, bot_response, status, remarks, category) 
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (timestamp, user_name or 'N/A', email, phone or 'N/A', query, response, "Initiated", "", category))
        except Exception as e:
            print(f"Error adding escalation: {e}")

    @staticmethod
    def get_all_escalated():
        with sqlite3.connect(DB_PATHS["ESCALATION"]) as conn:
            conn.row_factory = sqlite3.Row
            cursor = conn.execute("SELECT * FROM escalated_queries ORDER BY timestamp DESC")
            return [dict(row) for row in cursor.fetchall()]

    @staticmethod
    def update_status(query_id, status, remarks):
        with sqlite3.connect(DB_PATHS["ESCALATION"]) as conn:
            cursor = conn.execute(
                "UPDATE escalated_queries SET status = ?, remarks = ? WHERE id = ?",
                (status, remarks, query_id)
            )
            return cursor.rowcount > 0