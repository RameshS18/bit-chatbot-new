import os
from datetime import datetime
import pytz
import docx
import pypdf
from core.constants import DOCUMENTS_DIR
from repositories.staff_repo import StaffRepository
from infrastructure.vector_store import VectorStoreManager

IST = pytz.timezone('Asia/Kolkata')

class DocumentService:
    
    def __init__(self, vector_manager: VectorStoreManager):
        self.vector_manager = vector_manager

    def get_folders(self):
        """Lists subfolders in documents directory."""
        folders = ["Main Folder"]
        if os.path.exists(DOCUMENTS_DIR):
            for item in os.listdir(DOCUMENTS_DIR):
                if os.path.isdir(os.path.join(DOCUMENTS_DIR, item)):
                    folders.append(item)
        return folders

    def list_documents(self):
        """Lists all files recursively."""
        files = []
        if os.path.exists(DOCUMENTS_DIR):
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
            ext = os.path.splitext(filename)[1].lower()
            if ext in ['.txt', '.md']:
                with open(path, 'r', encoding='utf-8', errors='ignore') as f:
                    return f.read(), None
            elif ext == '.docx':
                doc = docx.Document(path)
                return "\n".join([para.text for para in doc.paragraphs]), None
            elif ext == '.pdf':
                reader = pypdf.PdfReader(path)
                return "\n".join([page.extract_text() for page in reader.pages]), None
            else:
                return f"--- Binary file ({ext}) cannot be edited directly ---", None
        except Exception as e:
            return None, f"Error reading file: {str(e)}"

    def save_document(self, filename, content, staff_id):
        if not filename.endswith(('.txt', '.md')):
            return False, "Only .txt and .md files can be edited."
            
        path = os.path.join(DOCUMENTS_DIR, filename)
        try:
            with open(path, 'w', encoding='utf-8') as f:
                f.write(content)
            
            self._log(staff_id, "Document Edited", filename)
            return True, "Saved successfully"
        except Exception as e:
            return False, str(e)

    def add_document(self, filename, content, folder, staff_id):
        if not filename.endswith(('.txt', '.md')):
            filename += ".txt"
            
        target_dir = DOCUMENTS_DIR
        if folder and folder != "Main Folder":
            target_dir = os.path.join(DOCUMENTS_DIR, folder)
            
        os.makedirs(target_dir, exist_ok=True)
        path = os.path.join(target_dir, filename)
        
        if os.path.exists(path):
            return False, "File already exists"
            
        try:
            with open(path, 'w', encoding='utf-8') as f:
                f.write(content)
            
            log_name = filename if folder == "Main Folder" else f"{folder}/{filename}"
            self._log(staff_id, "Document Added", log_name)
            return True, "Document added"
        except Exception as e:
            return False, str(e)

    def upload_file(self, file, folder, staff_id):
        target_dir = DOCUMENTS_DIR
        if folder and folder != "Main Folder":
            target_dir = os.path.join(DOCUMENTS_DIR, folder)
            
        os.makedirs(target_dir, exist_ok=True)
        filename = file.filename
        path = os.path.join(target_dir, filename)
        
        try:
            file.save(path)
            log_name = filename if folder == "Main Folder" else f"{folder}/{filename}"
            self._log(staff_id, "File Uploaded", log_name)
            return True, "File uploaded"
        except Exception as e:
            return False, str(e)

    def delete_document(self, filename, staff_id):
        path = os.path.join(DOCUMENTS_DIR, filename)
        if not os.path.exists(path):
            return False, "File not found"
            
        try:
            os.remove(path)
            self._log(staff_id, "Document Deleted", filename)
            return True, "Deleted successfully"
        except Exception as e:
            return False, str(e)

    def get_download_path(self, filename):
        path = os.path.join(DOCUMENTS_DIR, filename)
        if not os.path.exists(path):
            return None, None, "File not found"
            
        directory = os.path.dirname(path)
        name = os.path.basename(path)
        return directory, name, None

    def rebuild_index(self, staff_id):
        success = self.vector_manager.rebuild_index()
        if success:
            self._log(staff_id, "Index Rebuilt", "All")
        return success

    def _log(self, staff_id, action, doc_name):
        timestamp = datetime.now(IST).isoformat()
        StaffRepository.log_action(staff_id, timestamp, action, doc_name)