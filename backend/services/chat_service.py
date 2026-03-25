from datetime import datetime
import pytz
from repositories.chat_repo import ChatRepository
from repositories.escalation_repo import EscalationRepository
from repositories.user_repo import UserRepository
from infrastructure.llm_client import LLMClient
from infrastructure.email_service import EmailService

IST = pytz.timezone('Asia/Kolkata')
TRIGGER_MESSAGE = "We have received your query, soon our concerned department will contact you. Thank You!"

class ChatService:
    
    def __init__(self, llm_client: LLMClient):
        self.llm_client = llm_client

    def process_query(self, user_name, email, phone, query):
        if not query:
            return {"error": "Query is required"}, 400
            
        # 1. Update Last Seen
        timestamp = datetime.now(IST).isoformat()
        # [MODIFIED] Use phone instead of email for tracking since email is no longer collected
        if phone:
            UserRepository.update_last_seen_by_phone(phone, timestamp)
        
        # 2. Classify Query
        category = self.llm_client.classify_query(query)
        
        # 3. Get RAG Answer
        answer = self.llm_client.get_answer(query)
        
        # 4. Save Chat History
        ChatRepository.save_chat(timestamp, user_name, email, phone, query, answer, category)
        
        # 5. Check for Escalation Trigger
        if answer.strip() == TRIGGER_MESSAGE:
            self._handle_escalation(timestamp, user_name, email, phone, query, answer, category)
            
        return {"answer": answer}

    def _handle_escalation(self, timestamp, user_name, email, phone, query, answer, category):
        print(f"Trigger detected! Escalating to {category}...")
        
        # Save to Escalation DB
        EscalationRepository.add_escalation(timestamp, user_name, email, phone, query, answer, category)
        
        # Send Email to Department
        user_info = {"user_name": user_name, "email": email, "phone_number": phone}
        EmailService.send_escalation(category, user_info, query, answer)