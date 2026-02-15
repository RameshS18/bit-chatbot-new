import os
from core.constants import DOCUMENTS_DIR
from repositories.staff_repo import StaffRepository
from infrastructure.vector_store import VectorStoreManager

class DocumentService:
    
    def __init__(self, vector_manager: VectorStoreManager):
        self.vector_manager = vector_manager

    def list_documents(self):
        files = []
        for root, _, filenames in os.walk(DOCUMENTS_DIR):
            for filename in filenames:
                rel_path = os.path.relpath(os.path.join(root, filename), DOCUMENTS_DIR)
                files.append(rel_path.replace("\\", "/"))
        return files

    def read_document(self, filename):
        path = os.path.join(DOCUMENTS_DIR, filename)
        if not os.path.exists(path):
            return None, "File not found"
        
        try:
            with open(path, 'r', encoding='utf-8') as f:
                return f.read(), None
        except Exception:
            return None, "Cannot read binary file"

    def save_document(self, filename, content, staff_id):
        path = os.path.join(DOCUMENTS_DIR, filename)
        with open(path, 'w', encoding='utf-8') as f:
            f.write(content)
        
        # Log action
        timestamp = datetime.now(IST).isoformat()
        StaffRepository.log_action(staff_id, timestamp, "Document Saved", filename)
        return True

    def rebuild_index(self, staff_id):
        success = self.vector_manager.rebuild_index()
        if success:
            timestamp = datetime.now(IST).isoformat()
            StaffRepository.log_action(staff_id, timestamp, "Index Rebuilt", "All")
        return success