from flask import Blueprint, request, jsonify, current_app

editor_bp = Blueprint('editor', __name__)

@editor_bp.route('/get-documents', methods=['GET'])
def get_docs():
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
    success = doc_service.save_document(
        data.get('filename'), 
        data.get('content'), 
        data.get('staff_id')
    )
    if success:
        return jsonify({"status": "success"})
    return jsonify({"error": "Failed to save"}), 500

@editor_bp.route('/commit-index', methods=['POST'])
def commit_index():
    doc_service = current_app.config['doc_service']
    staff_id = request.json.get('staff_id')
    
    success = doc_service.rebuild_index(staff_id)
    if success:
        # Reload the chat service's retriever
        # In a real prod app, you'd use a signal, but this works for now
        vector_manager = current_app.config['vector_manager']
        llm_client = current_app.config['llm_client']
        llm_client.retriever = vector_manager.retriever
        
        return jsonify({"status": "success", "message": "Index rebuilt"})
    return jsonify({"error": "Rebuild failed"}), 500