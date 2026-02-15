from datetime import datetime
import pytz
from repositories.user_repo import UserRepository
from repositories.escalation_repo import EscalationRepository
from repositories.chat_repo import ChatRepository

IST = pytz.timezone('Asia/Kolkata')

class AdminService:

    @staticmethod
    def get_dashboard_stats():
        # Note: You might want to add count methods to your Repositories for efficiency
        # For now, we fetch all and count in Python (okay for small-medium apps)
        users = UserRepository.get_all_users() # You need to add this method to UserRepo if missing
        escalated = EscalationRepository.get_all_escalated()
        
        today_str = str(datetime.now(IST).date())
        today_users = [u for u in users if u['last_seen'].startswith(today_str)]
        
        return {
            "totalUniqueUsers": len(users),
            "todayUsers": len(today_users),
            "totalEscalated": len([e for e in escalated if e['status'] == 'Initiated']),
            "totalSolved": len([e for e in escalated if e['status'] == 'Finished'])
        }

    @staticmethod
    def get_escalations():
        return EscalationRepository.get_all_escalated()

    @staticmethod
    def update_escalation(query_id, status, remarks):
        return EscalationRepository.update_status(query_id, status, remarks)