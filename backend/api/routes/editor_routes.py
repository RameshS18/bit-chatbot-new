import os
from flask import Blueprint, request, jsonify, current_app, send_from_directory
from core.config import Config
from core.constants import EMAIL_CONFIG_FILE
from repositories.staff_repo import StaffRepository

editor_bp = Blueprint('editor', __name__)

# --- 1. EDITOR AUTHENTICATION ---

@editor_bp.route('/login', methods=['POST'])
def editor_login():
    data = request.json
    email = data.get('email')
    password = data.get('password')
    if (email == Config.EDITOR_EMAIL and password == Config.EDITOR_PASSWORD):
        return jsonify({"status": "success", "message": "Editor login successful"})
    else:
        return jsonify({"error": "Invalid editor credentials"}), 401

@editor_bp.route('/verify-staff', methods=['POST'])
def verify_staff():
    data = request.json
    staff_id = data.get('staff_id')
    staff_name = data.get('staff_name')

    if not staff_id or not staff_name:
        return jsonify({"error": "Staff ID and Name are required"}), 400

    staff = StaffRepository.get_staff(staff_id)
    if not staff:
        StaffRepository.create_staff(staff_id, staff_name)
    
    from datetime import datetime
    import pytz
    IST = pytz.timezone('Asia/Kolkata')
    login_time = datetime.now(IST).isoformat()
    session_id = StaffRepository.create_session(staff_id, login_time)
    
    return jsonify({"status": "success", "message": "Staff verified", "staff_id": staff_id, "session_id": session_id})

@editor_bp.route('/logout', methods=['POST'])
def logout():
    data = request.json
    session_id = data.get('session_id')
    if session_id:
        from datetime import datetime
        import pytz
        IST = pytz.timezone('Asia/Kolkata')
        logout_time = datetime.now(IST).isoformat()
        StaffRepository.close_session(session_id, logout_time)
    return jsonify({"status": "success"})

# --- 2. EMAIL CONFIGURATION ROUTES (For the Editor Popup) ---

@editor_bp.route('/get-email-config', methods=['GET'])
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

@editor_bp.route('/save-email-config', methods=['POST'])
def save_email_config():
    """Overwrites the department_emails.txt file."""
    try:
        data = request.json
        content = data.get('content')
        if content is None:
            return jsonify({"error": "Content is required"}), 400
        
        with open(EMAIL_CONFIG_FILE, "w") as f:
            f.write(content)
            
        return jsonify({"status": "success", "message": "Email configuration saved."})
    except Exception as e:
        print(f"Error saving email config: {e}")
        return jsonify({"error": "Failed to save config"}), 500

# --- 3. FILE MANAGEMENT ROUTES ---

@editor_bp.route('/get-folders', methods=['GET'])
def get_folders():
    doc_service = current_app.config['doc_service']
    return jsonify(doc_service.get_folders())

@editor_bp.route('/get-documents', methods=['GET'])
def get_documents():
    doc_service = current_app.config['doc_service']
    return jsonify(doc_service.list_documents())

@editor_bp.route('/get-document-content', methods=['POST'])
def get_content():
    doc_service = current_app.config['doc_service']
    content, error = doc_service.read_document(request.json.get('filename'))
    if error:
        return jsonify({"error": error}), 400
    return jsonify({"content": content})

@editor_bp.route('/update-document', methods=['POST'])
def update_doc():
    doc_service = current_app.config['doc_service']
    data = request.json
    success, msg = doc_service.save_document(
        data.get('filename'), data.get('content'), data.get('staff_id')
    )
    if success:
        return jsonify({"status": "success", "message": msg})
    return jsonify({"error": msg}), 500

@editor_bp.route('/add-document', methods=['POST'])
def add_doc():
    doc_service = current_app.config['doc_service']
    data = request.json
    success, msg = doc_service.add_document(
        data.get('filename'), data.get('content'), data.get('folder'), data.get('staff_id')
    )
    if success:
        return jsonify({"status": "success", "message": msg})
    return jsonify({"error": msg}), 400

@editor_bp.route('/delete-document', methods=['POST'])
def delete_doc():
    doc_service = current_app.config['doc_service']
    data = request.json
    success, msg = doc_service.delete_document(data.get('filename'), data.get('staff_id'))
    if success:
        return jsonify({"status": "success", "message": msg})
    return jsonify({"error": msg}), 400

@editor_bp.route('/upload-file', methods=['POST'])
def upload_file():
    doc_service = current_app.config['doc_service']
    if 'file' not in request.files:
        return jsonify({"error": "No file part"}), 400
    file = request.files['file']
    folder = request.form.get('folder')
    staff_id = request.form.get('staff_id')
    success, msg = doc_service.upload_file(file, folder, staff_id)
    if success:
        return jsonify({"status": "success", "message": msg})
    return jsonify({"error": msg}), 500

@editor_bp.route('/download-file', methods=['GET'])
def download_file():
    doc_service = current_app.config['doc_service']
    filename = request.args.get('filename')
    directory, name, error = doc_service.get_download_path(filename)
    if error:
        return jsonify({"error": error}), 404
    return send_from_directory(directory, name, as_attachment=True)

@editor_bp.route('/commit-index', methods=['POST'])
def commit_index():
    doc_service = current_app.config['doc_service']
    staff_id = request.json.get('staff_id')
    success = doc_service.rebuild_index(staff_id)
    if success:
        vector_manager = current_app.config['vector_manager']
        llm_client = current_app.config['llm_client']
        llm_client.retriever = vector_manager.retriever
        return jsonify({"status": "success", "message": "Index rebuilt"})
    return jsonify({"error": "Rebuild failed"}), 500