from datetime import datetime, timedelta
import pytz
from repositories.user_repo import UserRepository
from repositories.escalation_repo import EscalationRepository
from repositories.chat_repo import ChatRepository
from repositories.staff_repo import StaffRepository

IST = pytz.timezone('Asia/Kolkata')

class AdminService:

    @staticmethod
    def get_dashboard_stats():
        users = UserRepository.get_all_users()
        escalated = EscalationRepository.get_all_escalated()
        
        today_str = str(datetime.now(IST).date())
        today_users = [u for u in users if u.get('last_seen', '').startswith(today_str)]
        
        return {
            "totalUniqueUsers": len(users),
            "todayUsers": len(today_users),
            "totalEscalated": len([e for e in escalated if e.get('status') == 'Initiated']),
            "totalSolved": len([e for e in escalated if e.get('status') == 'Finished'])
        }

    @staticmethod
    def get_escalations():
        return EscalationRepository.get_all_escalated()

    @staticmethod
    def get_all_users():
        return UserRepository.get_all_users()

    @staticmethod
    def get_all_chats():
        return ChatRepository.get_all_chats()

    @staticmethod
    def update_escalation(query_id, status, remarks):
        return EscalationRepository.update_status(query_id, status, remarks)

    # --- NEW METHODS ---

    @staticmethod
    def get_today_users():
        today_str = str(datetime.now(IST).date())
        return UserRepository.get_today_users(today_str)

    @staticmethod
    def get_user_queries(phone):
        """Fetches history for a specific user by phone."""
        return EscalationRepository.get_escalations_by_phone(phone)

    @staticmethod
    def get_escalated_users_summary():
        """Groups escalated queries by user."""
        all_escalations = EscalationRepository.get_all_escalated()
        pending = [e for e in all_escalations if e['status'] == 'Initiated']
        
        user_map = {}
        for item in pending:
            # [MODIFIED] Use phone_number instead of email as key since email is no longer collected
            phone = item.get('phone_number')
            if phone not in user_map:
                user_map[phone] = {
                    "user_name": item.get('user_name'),
                    # "email": email, # [COMMENTED OUT] Email no longer collected
                    "phone_number": phone,
                    "query_count": 0
                }
            user_map[phone]['query_count'] += 1
            
        result = list(user_map.values())
        result.sort(key=lambda x: x['query_count'], reverse=True)
        return result

    @staticmethod
    def get_solved_users_summary():
        """Groups solved queries by user."""
        all_escalations = EscalationRepository.get_all_escalated()
        solved = [e for e in all_escalations if e['status'] == 'Finished']
        
        user_map = {}
        for item in solved:
            # [MODIFIED] Use phone_number instead of email as key since email is no longer collected
            phone = item.get('phone_number')
            if phone not in user_map:
                user_map[phone] = {
                    "user_name": item.get('user_name'),
                    # "email": email, # [COMMENTED OUT] Email no longer collected
                    "phone_number": phone,
                    "query_count": 0
                }
            user_map[phone]['query_count'] += 1
            
        result = list(user_map.values())
        result.sort(key=lambda x: x['query_count'], reverse=True)
        return result

    @staticmethod
    def get_editor_staff():
        return StaffRepository.get_staff_with_login()

    @staticmethod
    def get_editor_logs(search_term, filter_period):
        return StaffRepository.get_detailed_logs(search_term, filter_period)