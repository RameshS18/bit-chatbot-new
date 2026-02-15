import os
import sys
from dotenv import load_dotenv

# Load .env file immediately
load_dotenv()

class Config:
    """
    Central configuration for the application.
    Validates that all required environment variables are present.
    """
    
    # --- API Keys ---
    GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
    if not GOOGLE_API_KEY:
        sys.exit("Error: GOOGLE_API_KEY is missing in .env file.")

    # --- Email Configuration ---
    EMAIL_SENDER = os.getenv("email_id")
    if not EMAIL_SENDER:
        sys.exit("Error: email_id is missing in .env file.")

    # --- SMS Configuration (SmartPing) ---
    SMARTPING_PASS = os.getenv("SMARTPING_PASS")
    # Note: We don't exit here if missing, just warn, in case SMS is optional
    if not SMARTPING_PASS:
        print("Warning: SMARTPING_PASS is missing. SMS features may fail.")

    # --- Editor Credentials (Static for now, as per your original code) ---
    EDITOR_EMAIL = "editor.bitra@bitsathy.ac.in"
    EDITOR_PASSWORD = "editor.pass.bitra@12345"

    # --- Flask Settings ---
    DEBUG_MODE = True
    PORT = 5000