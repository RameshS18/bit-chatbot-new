import os
import docx
import pypdf

class FileHandler:
    """
    Reads content from various file formats.
    """
    
    @staticmethod
    def read_file(file_path):
        if not os.path.exists(file_path):
            return "Error: File not found."
            
        ext = os.path.splitext(file_path)[1].lower()
        
        try:
            if ext in ['.txt', '.md']:
                with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                    return f.read()
            elif ext == '.docx':
                doc = docx.Document(file_path)
                return "\n".join([para.text for para in doc.paragraphs])
            elif ext == '.pdf':
                reader = pypdf.PdfReader(file_path)
                return "\n".join([page.extract_text() for page in reader.pages])
            else:
                return f"Unsupported file format: {ext}"
        except Exception as e:
            return f"Error reading file: {str(e)}"