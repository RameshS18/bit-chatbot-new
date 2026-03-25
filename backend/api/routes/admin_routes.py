import os
import io
import csv
from flask import Blueprint, jsonify, request, make_response
from services.admin_service import AdminService
from core.constants import EMAIL_CONFIG_FILE

admin_bp = Blueprint('admin', __name__)

# --- Stats Counter ---
@admin_bp.route('/stats', methods=['GET'])
def get_stats():
    return jsonify(AdminService.get_dashboard_stats())

# --- Detailed Lists ---
@admin_bp.route('/all-users', methods=['GET'])
def get_all_users():
    return jsonify(AdminService.get_all_users())

@admin_bp.route('/chat-history', methods=['GET'])
def get_chat_history():
    return jsonify(AdminService.get_all_chats())

@admin_bp.route('/escalated-queries', methods=['GET'])
def get_escalations():
    return jsonify(AdminService.get_escalations())

@admin_bp.route('/update-query/<int:query_id>', methods=['PUT'])
def update_query(query_id):
    data = request.json
    success = AdminService.update_escalation(
        query_id, 
        data.get('status'), 
        data.get('remarks')
    )
    if success:
        return jsonify({"status": "success", "message": "Query updated"})
    return jsonify({"error": "Query not found"}), 404

# --- Popup Routes ---
@admin_bp.route('/today-users', methods=['GET'])
def get_today_users():
    return jsonify(AdminService.get_today_users())

@admin_bp.route('/escalated-users', methods=['GET'])
def get_escalated_users():
    return jsonify(AdminService.get_escalated_users_summary())

@admin_bp.route('/solved-users', methods=['GET'])
def get_solved_users():
    return jsonify(AdminService.get_solved_users_summary())

# [MODIFIED] Use phone instead of email for user query lookup
@admin_bp.route('/user-queries/<phone>', methods=['GET'])
def get_user_queries(phone):
    return jsonify(AdminService.get_user_queries(phone))

# --- Editor/Staff Logs ---
@admin_bp.route('/editor-staff', methods=['GET'])
def get_editor_staff():
    return jsonify(AdminService.get_editor_staff())

@admin_bp.route('/editor-logs', methods=['GET'])
def get_editor_logs():
    search = request.args.get('search', '')
    filter_period = request.args.get('filter', 'all')
    return jsonify(AdminService.get_editor_logs(search, filter_period))

@admin_bp.route('/download-editor-logs', methods=['GET'])
def download_editor_logs():
    search = request.args.get('search', '')
    filter_period = request.args.get('filter', 'all')
    
    logs = AdminService.get_editor_logs(search, filter_period)
    
    si = io.StringIO()
    cw = csv.writer(si)
    
    if logs:
        cw.writerow(logs[0].keys())
        for row in logs:
            cw.writerow(row.values())
    else:
        cw.writerow(['No logs found'])

    output = make_response(si.getvalue())
    output.headers["Content-Disposition"] = "attachment; filename=editor_logs.csv"
    output.headers["Content-type"] = "text/csv"
    return output

# --- NEW: Email Config Routes (Fixed 404) ---
@admin_bp.route('/get-email-config', methods=['GET'])
def get_email_config():
    """Reads the department_emails.txt file."""
    try:
        if os.path.exists(EMAIL_CONFIG_FILE):
            with open(EMAIL_CONFIG_FILE, "r") as f:
                content = f.read()
            return jsonify({"content": content})
        return jsonify({"content": ""})
    except Exception as e:
        print(f"Error reading email config: {e}")
        return jsonify({"error": "Failed to read config"}), 500

@admin_bp.route('/save-email-config', methods=['POST'])
def save_email_config():
    """Overwrites the department_emails.txt file."""
    try:
        data = request.json
        content = data.get('content')
        if content is None:
            return jsonify({"error": "Content is required"}), 400
        
        # Ensure directory exists before writing
        os.makedirs(os.path.dirname(EMAIL_CONFIG_FILE), exist_ok=True)
        
        with open(EMAIL_CONFIG_FILE, "w") as f:
            f.write(content)
            
        return jsonify({"status": "success", "message": "Email configuration saved."})
    except Exception as e:
        print(f"Error saving email config: {e}")
        return jsonify({"error": "Failed to save config"}), 500