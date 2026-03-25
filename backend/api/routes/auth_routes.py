from flask import Blueprint, request, jsonify
from services.auth_service import AuthService

auth_bp = Blueprint('auth', __name__)

# ========================================================================================
# [COMMENTED OUT] OTP request route — kept for future re-enablement
# ========================================================================================
# @auth_bp.route('/request-otp', methods=['POST'])
# def request_otp():
#     data = request.json
#     email = data.get('email')
#     response, status = AuthService.request_otp(email)
#     return jsonify(response), status

# ========================================================================================
# [COMMENTED OUT] OTP-based login route — kept for future re-enablement
# ========================================================================================
# @auth_bp.route('/login', methods=['POST'])
# def login():
#     data = request.json
#     response, status = AuthService.login_user(
#         data.get('email'), 
#         data.get('otp'), 
#         data.get('name'), 
#         data.get('phone')
#     )
#     return jsonify(response), status

# ========================================================================================
# [NEW] Direct login route — no OTP needed, just name + phone + email
# ========================================================================================
@auth_bp.route('/direct-login', methods=['POST'])
def direct_login():
    data = request.json
    response, status = AuthService.direct_login(
        # data.get('email'),  # [COMMENTED OUT] Email no longer collected from user
        data.get('name'),
        data.get('phone')
    )
    return jsonify(response), status