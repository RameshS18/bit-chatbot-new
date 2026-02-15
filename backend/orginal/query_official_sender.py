import os
import base64
from email.mime.text import MIMEText
from google.oauth2.credentials import Credentials
from google.auth.transport.requests import Request
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError
from dotenv import load_dotenv

# Load env for the "From" address
load_dotenv()
EMAIL_SENDER = os.environ.get("email_id")

# Auth Configuration (Same as your OTP script)
SCOPES = ["https://www.googleapis.com/auth/gmail.send"]
CLIENT_SECRET_FILE = "client_secret.json"
TOKEN_FILE = "token.json"

def get_gmail_service():
    """Authenticates using the existing token.json from the OTP setup."""
    creds = None
    if os.path.exists(TOKEN_FILE):
        creds = Credentials.from_authorized_user_file(TOKEN_FILE, SCOPES)
    
    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            try:
                creds.refresh(Request())
            except Exception:
                print("Token expired and refresh failed.")
                return None
        else:
            print("No valid token found. Please run gmail_send_otp.py first to authenticate.")
            return None

    try:
        service = build("gmail", "v1", credentials=creds)
        return service
    except HttpError as error:
        print(f"An error occurred building the service: {error}")
        return None

def create_escalation_message(to_email, category, user_details, query, bot_response):
    """Creates the HTML email for the department official."""
    subject = f"Escalated Query: {category} - {user_details.get('user_name', 'Student')}"
    
    body = f"""
    <html>
    <head>
        <style>
            .container {{ font-family: Arial, sans-serif; padding: 20px; border: 1px solid #ddd; max-width: 600px; }}
            .header {{ font-size: 20px; font-weight: bold; color: #d32f2f; margin-bottom: 15px; }}
            .label {{ font-weight: bold; color: #555; }}
            .content {{ background: #f9f9f9; padding: 10px; border-left: 4px solid #004a99; margin-bottom: 15px; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">Action Required: New Student Query ({category})</div>
            <p>Dear Official,</p>
            <p>The AI Chatbot has escalated a query that requires your attention.</p>
            
            <p class="label">Student Details:</p>
            <ul>
                <li><strong>Name:</strong> {user_details.get('user_name', 'N/A')}</li>
                <li><strong>Email:</strong> {user_details.get('email', 'N/A')}</li>
                <li><strong>Phone:</strong> {user_details.get('phone_number', 'N/A')}</li>
            </ul>

            <p class="label">User Query:</p>
            <div class="content">{query}</div>

            <p class="label">AI Auto-Response Given:</p>
            <div class="content">{bot_response}</div>

            <p>Please contact the student to resolve this issue.</p>
        </div>
    </body>
    </html>
    """

    message = MIMEText(body, 'html')
    message["To"] = to_email
    message["From"] = EMAIL_SENDER
    message["Subject"] = subject
    
    raw_message = base64.urlsafe_b64encode(message.as_bytes()).decode()
    return {"raw": raw_message}

def send_escalation_email_gmail(to_email, category, user_details, query, bot_response):
    """Sends the email using Gmail API."""
    if not EMAIL_SENDER:
        print("Error: EMAIL_SENDER not found in env.")
        return False

    service = get_gmail_service()
    if not service:
        print("Gmail service not available.")
        return False
        
    message_body = create_escalation_message(to_email, category, user_details, query, bot_response)
    
    try:
        message = service.users().messages().send(userId="me", body=message_body).execute()
        print(f"Escalation email sent to {to_email} (Msg ID: {message['id']})")
        return True
    except HttpError as error:
        print(f"Error sending escalation email: {error}")
        return False