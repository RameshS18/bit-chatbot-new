from flask import Blueprint, request, jsonify, current_app

chat_bp = Blueprint('chat', __name__)

@chat_bp.route('/chat', methods=['POST'])
def chat():
    data = request.json
    # Get the initialized service from app config
    chat_service = current_app.config['chat_service']
    
    response = chat_service.process_query(
        data.get('user_name'),
        data.get('email'),
        data.get('phone_number'),
        data.get('query')
    )
    
    if "error" in response:
        return jsonify(response), 400
    return jsonify(response)