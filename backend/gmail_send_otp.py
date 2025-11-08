#
# This file is: gmail_send_otp.py
#
import os.path
import sys
import base64
from email.mime.text import MIMEText
from dotenv import load_dotenv

from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError

# --- Configuration ---
# If modifying these scopes, delete token.json.
SCOPES = ["https://www.googleapis.com/auth/gmail.send"]
CLIENT_SECRET_FILE = "client_secret.json"
TOKEN_FILE = "token.json"

# --- Load the "From" Email Address ---
load_dotenv()
EMAIL_SENDER = os.environ.get("email_id")
if not EMAIL_SENDER:
    print("Error: 'email_id' not found in .env file.")
    print("This must be the email address you are authenticating with.")
    sys.exit(1)
# --- End Configuration ---


def get_gmail_service():
    """
    Authenticates with the Gmail API and returns a service object.
    Handles the OAuth 2.0 flow and token refreshing.
    """
    creds = None
    # The file token.json stores the user's access and refresh tokens.
    if os.path.exists(TOKEN_FILE):
        creds = Credentials.from_authorized_user_file(TOKEN_FILE, SCOPES)
    
    # If there are no (valid) credentials available, let the user log in.
    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            print("Refreshing expired token...")
            try:
                creds.refresh(Request())
            except Exception as e:
                print(f"Error refreshing token: {e}")
                print("Token refresh failed. Please re-authenticate.")
                # Force re-authentication by deleting the bad token
                os.remove(TOKEN_FILE) 
                return get_gmail_service() # Recurse
        else:
            print(f"No valid token found. Starting OAuth flow using {CLIENT_SECRET_FILE}...")
            if not os.path.exists(CLIENT_SECRET_FILE):
                print(f"Error: {CLIENT_SECRET_FILE} not found.")
                print("Please download it from Google Cloud Console and rename it.")
                return None
            
            # This is the "Desktop App" flow
            flow = InstalledAppFlow.from_client_secrets_file(
                CLIENT_SECRET_FILE, SCOPES
            )
            # This will open a browser for the user to authorize
            creds = flow.run_local_server(port=0) 
        
        # Save the credentials for the next run
        print(f"Saving new token to {TOKEN_FILE}...")
        with open(TOKEN_FILE, "w") as token:
            token.write(creds.to_json())
    
    try:
        service = build("gmail", "v1", credentials=creds)
        print("Gmail service connection successful.")
        return service
    except HttpError as error:
        print(f"An error occurred building the service: {error}")
        return None

def create_message(to_email, otp):
    """
    Creates the HTML email message for the OTP.
    """
    subject = "Your BITRA Chatbot Verification Code"
    body = f"""
    <html>
    <head>
        <style>
            .container {{ font-family: Arial, sans-serif; padding: 20px; border: 1px solid #ddd; border-radius: 5px; max-width: 600px; margin: auto; }}
            .header {{ font-size: 24px; color: #333; }}
            .otp-code {{
                font-size: 36px;
                font-weight: bold;
                color: #004a99;
                margin: 20px 0;
                letter-spacing: 2px;
                text-align: center;
                padding: 10px;
                background-color: #f4f4f4;
                border-radius: 5px;
            }}
            .footer {{ font-size: 12px; color: #888; margin-top: 20px; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">Hello,</div>
            <p>Thank you for verifying your email for the BITRA Chatbot.</p>
            <p>Your One-Time Password (OTP) is:</p>
            <div class="otp-code">{otp}</div>
            <p>This code is valid for 10 minutes.</p>
            <p class="footer">
                Best regards,<br>
                Bannari Amman Institute of Technology
            </p>
        </div>
    </body>
    </html>
    """
    
    message = MIMEText(body, 'html')
    message["To"] = to_email
    message["From"] = EMAIL_SENDER # Use the email from .env
    message["Subject"] = subject
    
    # Base64 encode the message for the Gmail API
    raw_message = base64.urlsafe_b64encode(message.as_bytes()).decode()
    return {"raw": raw_message}

def send_otp_email_gmail(recipient_email, otp):
    """
    The main function called by app.py.
    It gets the service and sends the email.
    """
    service = get_gmail_service()
    if not service:
        print("Failed to get Gmail service. Email not sent.")
        return False
        
    message_body = create_message(recipient_email, otp)
    
    try:
        # Use 'me' to refer to the authenticated user
        message = (
            service.users()
            .messages()
            .send(userId="me", body=message_body)
            .execute()
        )
        print(f"Successfully sent OTP to {recipient_email}. Message ID: {message['id']}")
        return True
    except HttpError as error:
        print(f"An error occurred sending email: {error}")
        # Handle common errors
        if error.resp.status == 403:
            print("Error 403: Gmail API may not be enabled. Please enable it in your Google Cloud project.")
        return False
    except Exception as e:
        print(f"An unknown error occurred: {e}")
        return False

# --- This part is for the ONE-TIME setup ---
if __name__ == "__main__":
    print("--- Running Gmail API Authentication ---")
    print("This script will authenticate your Google account to send emails.")
    print("Your browser will open for you to log in and grant permission.")
    print("Please use the account: " + EMAIL_SENDER)
    get_gmail_service()
    print("--- Authentication complete. 'token.json' has been created. ---")
    print("You can now run your main 'app.py' server.")