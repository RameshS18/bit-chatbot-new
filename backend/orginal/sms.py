import requests
import random
import os  # <-- Import 'os' to read environment variables

# --- 1. SET YOUR DETAILS ---

# 🔑 STEP 1: Set your password in your terminal *before* running this script.
#
#    In PowerShell (what you are using):
#    $env:SMARTPING_PASS = "ZExl#Ncl3nty4ZV97"
#
#    Then, the code below will read it securely.
API_PASSWORD = os.environ.get("SMARTPING_PASS")  ### <<< CHANGED FOR SECURITY

# This MUST be a 6-character Header (Sender ID)
# that you have registered and got approved on the DLT portal.
SENDER_ID = "betsms"

# Your 10-digit mobile number, starting with 91
RECIPIENT_MOBILE = "919042943953"

# Use the ".trans" account for transactional messages like OTPs
API_USERNAME = "betsms01.trans"

# 🖥️ STEP 2: Find your correct API domain in your Smartping dashboard
# The old one ('api.smartping.live') was wrong.
# It might be something like 'api.webpostservice.com' or another domain.
# Replace 'YOUR_API_DOMAIN_HERE' with the correct one.
API_URL = "http://smartping.live/rest/services/sendSMS"  ### <<< CHANGED (THIS WAS THE ERROR)

# --- 2. Generate OTP and Message ---
otp = random.randint(100000, 999999)
# IMPORTANT: This message MUST match a template you registered on DLT.
# You often need to use a variable like {#var#} in your template.
message_text = f"Your OTP is {otp}. Do not share this with anyone."

# --- 3. Check for Password ---
if not API_PASSWORD:
    print("Error: 'SMARTPING_PASS' environment variable is not set.")
    print("Please set it in your terminal first:")
    print("(venv) PS> $env:SMARTPING_PASS = \"YOUR_PASSWORD\"")
    exit()

# --- 4. Set up the API parameters ---
payload = {
    'username': API_USERNAME,
    'password': API_PASSWORD,
    'sendername': SENDER_ID,
    'mobileno': RECIPIENT_MOBILE,
    'message': message_text
}

print(f"Sending OTP {otp} to {RECIPIENT_MOBILE}...")

try:
    # --- 5. Make the API call ---
    response = requests.get(API_URL, params=payload)

    # --- 6. Print the server's response ---
    print(f"\n--- Server Response ---")
    print(f"Status Code: {response.status_code}")
    print(f"Response Text: {response.text}")
    print(f"-------------------------")

    if "Sent" in response.text:
        print("\nSuccess: SMS was sent (or is processing).")
    else:
        print("\nError: SMS may not have been sent. Check the response text.")

except requests.exceptions.RequestException as e:
    print(f"\nAn error occurred connecting to the API: {e}")