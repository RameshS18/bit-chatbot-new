from datetime import datetime, timedelta
import pytz
# [KEPT] OTP imports — commented out but preserved for future use
# from core.security import SecurityUtils
from core.security import SecurityUtils  # kept for potential future use
from repositories.user_repo import UserRepository
# from infrastructure.email_service import EmailService  # [COMMENTED OUT] OTP email service

IST = pytz.timezone('Asia/Kolkata')

class AuthService:
    
    # ========================================================================================
    # [COMMENTED OUT] OTP-based request_otp method — kept for future re-enablement
    # ========================================================================================
    # @staticmethod
    # def request_otp(email):
    #     if not email:
    #         return {"error": "Email is required"}, 400
    #         
    #     otp = SecurityUtils.generate_otp()
    #     otp_hash = SecurityUtils.hash_text(otp)
    #     expires_at = (datetime.now(IST) + timedelta(minutes=10)).isoformat()
    #     
    #     # Save to DB
    #     UserRepository.save_otp(email, otp_hash, expires_at)
    #     
    #     # Send Email
    #     if EmailService.send_otp(email, otp):
    #         return {"status": "success", "message": "OTP sent."}, 200
    #     else:
    #         return {"error": "Failed to send OTP email"}, 500

    # ========================================================================================
    # [COMMENTED OUT] OTP-based login_user method — kept for future re-enablement
    # ========================================================================================
    # @staticmethod
    # def login_user(email, otp, name, phone):
    #     # Validation
    #     if not email or not otp:
    #          return {"error": "Email and OTP are required"}, 400
    #
    #     current_time = datetime.now(IST).isoformat()
    #     otp_hash = SecurityUtils.hash_text(otp)
    #     
    #     # Verify OTP
    #     row = UserRepository.verify_otp(email, otp_hash, current_time)
    #     if not row:
    #         return {"error": "Invalid or Expired OTP"}, 401
    #         
    #     # Create or Update User
    #     action = UserRepository.create_or_update_user(email, name, phone, current_time)
    #     msg = "Login successful" if action == "updated" else "Registration successful"
    #     
    #     return {"status": "success", "message": msg, "email": email}, 200

    # ========================================================================================
    # [NEW] Direct login — no OTP, no user type selection, just register/update and login
    # ========================================================================================
    @staticmethod
    def direct_login(email, name, phone):
        # Validation
        if not email:
            return {"error": "Email is required"}, 400
        if not name:
            return {"error": "Name is required"}, 400
        if not phone:
            return {"error": "Phone is required"}, 400

        current_time = datetime.now(IST).isoformat()
        
        # Create or Update User (same DB logic as before, just without OTP check)
        action = UserRepository.create_or_update_user(email, name, phone, current_time)
        msg = "Login successful" if action == "updated" else "Registration successful"
        
        return {"status": "success", "message": msg, "email": email}, 200