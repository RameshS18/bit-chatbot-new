from flask import Blueprint, jsonify, request
from services.admin_service import AdminService

admin_bp = Blueprint('admin', __name__)

@admin_bp.route('/stats', methods=['GET'])
def get_stats():
    return jsonify(AdminService.get_dashboard_stats())

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