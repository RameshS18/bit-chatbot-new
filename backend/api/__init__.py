from flask import Flask
from flask_cors import CORS
from core.config import Config
from repositories.database_manager import DatabaseManager

# Import Services & Infrastructure
from infrastructure.vector_store import VectorStoreManager
from infrastructure.llm_client import LLMClient
from services.chat_service import ChatService
from services.document_service import DocumentService

# Import Blueprints
from api.routes.auth_routes import auth_bp
from api.routes.chat_routes import chat_bp
from api.routes.admin_routes import admin_bp
from api.routes.editor_routes import editor_bp

def create_app():
    app = Flask(__name__)
    CORS(app)
    
    # 1. Initialize Database Tables
    DatabaseManager.initialize_databases()
    
    # 2. Initialize Heavy AI Components (Singletons)
    print("--- Loading AI Components... ---")
    vector_manager = VectorStoreManager()
    retriever = vector_manager.load_or_create_index()
    
    llm_client = LLMClient(retriever)
    
    # 3. Initialize Services
    chat_service = ChatService(llm_client)
    doc_service = DocumentService(vector_manager)
    
    # 4. Attach to App Config (Dependency Injection)
    app.config['vector_manager'] = vector_manager
    app.config['llm_client'] = llm_client
    app.config['chat_service'] = chat_service
    app.config['doc_service'] = doc_service
    
    # 5. Register Routes
    app.register_blueprint(auth_bp)
    app.register_blueprint(chat_bp)
    app.register_blueprint(admin_bp, url_prefix='/admin')
    app.register_blueprint(editor_bp, url_prefix='/editor')
    
    return app