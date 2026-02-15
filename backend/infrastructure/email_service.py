import os
import base64
from email.mime.text import MIMEText
from google.oauth2.credentials import Credentials
from google.auth.transport.requests import Request
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError
from core.constants import TOKEN_FILE, EMAIL_CONFIG_FILE
from core.config import Config

class EmailService:
    """
    Handles sending emails via Gmail API for OTPs and Escalations.
    """
    SCOPES = ["https://www.googleapis.com/auth/gmail.send"]

    @staticmethod
    def get_service():
        """Authenticates and returns the Gmail service."""
        creds = None
        if os.path.exists(TOKEN_FILE):
            creds = Credentials.from_authorized_user_file(TOKEN_FILE, EmailService.SCOPES)
        
        if not creds or not creds.valid:
            if creds and creds.expired and creds.refresh_token:
                try:
                    creds.refresh(Request())
                except Exception:
                    return None
            else:
                return None

        try:
            return build("gmail", "v1", credentials=creds)
        except HttpError as error:
            print(f"Gmail Service Error: {error}")
            return None

    @staticmethod
    def send_email(to_email, subject, html_body):
        """Generic function to send an email."""
        service = EmailService.get_service()
        if not service:
            print("Gmail service unavailable.")
            return False

        try:
            message = MIMEText(html_body, 'html')
            message["To"] = to_email
            message["From"] = Config.EMAIL_SENDER
            message["Subject"] = subject
            
            raw_message = base64.urlsafe_b64encode(message.as_bytes()).decode()
            service.users().messages().send(userId="me", body={"raw": raw_message}).execute()
            return True
        except Exception as e:
            print(f"Failed to send email to {to_email}: {e}")
            return False

    @staticmethod
    def send_otp(to_email, otp):
        """Sends an OTP email with the exact styling from the screenshot."""
        subject = "Your BITRA Chatbot Verification Code"
        
        # Exact HTML replication of your screenshot
        body = f"""
        <html>
        <head>
            <style>
                body {{ font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #ffffff; margin: 0; padding: 0; }}
                .container {{ max-width: 600px; margin: 20px auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px; background-color: #ffffff; }}
                .greeting {{ font-size: 24px; color: #333333; margin-bottom: 20px; font-weight: normal; }}
                .text {{ font-size: 16px; color: #333333; line-height: 1.6; margin-bottom: 15px; }}
                .highlight {{ background-color: #ffe082; padding: 2px 4px; border-radius: 2px; font-weight: 500; }}
                .otp-box {{ background-color: #f5f5f5; padding: 30px; text-align: center; border-radius: 4px; margin: 30px 0; }}
                .otp-code {{ font-size: 36px; font-weight: bold; color: #004a99; letter-spacing: 2px; }}
                .footer {{ margin-top: 40px; color: #666666; font-size: 14px; line-height: 1.6; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="greeting">Hello,</div>
                
                <div class="text">
                    Thank you for verifying your email for the <strong>BITRA</strong> Chatbot.
                </div>
                
                <div class="text">
                    Your One-Time Password (OTP) is:
                </div>
                
                <div class="otp-box">
                    <span class="otp-code">{otp}</span>
                </div>
                
                <div class="text">
                    This code is valid for 10 minutes.
                </div>
                
                <div class="footer">
                    Best regards,<br>
                    Bannari Amman Institute of Technology
                </div>
            </div>
        </body>
        </html>
        """
        return EmailService.send_email(to_email, subject, body)

    @staticmethod
    def get_department_email(category):
        """Reads department_emails.txt to find the right official."""
        try:
            if os.path.exists(EMAIL_CONFIG_FILE):
                with open(EMAIL_CONFIG_FILE, "r") as f:
                    for line in f:
                        if "=" in line:
                            key, value = line.strip().split("=")
                            if key.lower() == category.lower():
                                return value
        except Exception:
            pass
        return Config.EMAIL_SENDER  # Fallback to Admin

    @staticmethod
    def send_escalation(category, user_details, query, bot_response):
        """Sends an escalation email to the department head."""
        target_email = EmailService.get_department_email(category)
        subject = f"Escalated Query: {category} - {user_details.get('user_name')}"
        
        body = f"""
        <div style="font-family: Arial; padding: 20px;">
            <h2 style="color: #d32f2f;">Action Required: Student Query ({category})</h2>
            <p><strong>Student:</strong> {user_details.get('user_name')} ({user_details.get('email')})</p>
            <p><strong>Phone:</strong> {user_details.get('phone_number')}</p>
            <hr>
            <p><strong>Query:</strong><br>{query}</p>
            <p><strong>Bot Response:</strong><br>{bot_response}</p>
        </div>
        """
        return EmailService.send_email(target_email, subject, body)