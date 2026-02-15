from datetime import datetime, timedelta
import pytz
from core.security import SecurityUtils
from repositories.user_repo import UserRepository
from infrastructure.email_service import EmailService

IST = pytz.timezone('Asia/Kolkata')

class AuthService:
    
    @staticmethod
    def request_otp(email):
        if not email:
            return {"error": "Email is required"}, 400
            
        otp = SecurityUtils.generate_otp()
        otp_hash = SecurityUtils.hash_text(otp)
        expires_at = (datetime.now(IST) + timedelta(minutes=10)).isoformat()
        
        # Save to DB
        UserRepository.save_otp(email, otp_hash, expires_at)
        
        # Send Email
        if EmailService.send_otp(email, otp):
            return {"status": "success", "message": "OTP sent."}, 200
        else:
            return {"error": "Failed to send OTP email"}, 500

    @staticmethod
    def login_user(email, otp, name, phone):
        # Validation
        if not email or not otp:
             return {"error": "Email and OTP are required"}, 400

        current_time = datetime.now(IST).isoformat()
        otp_hash = SecurityUtils.hash_text(otp)
        
        # Verify OTP
        row = UserRepository.verify_otp(email, otp_hash, current_time)
        if not row:
            return {"error": "Invalid or Expired OTP"}, 401
            
        # Create or Update User
        action = UserRepository.create_or_update_user(email, name, phone, current_time)
        msg = "Login successful" if action == "updated" else "Registration successful"
        
        return {"status": "success", "message": msg, "email": email}, 200