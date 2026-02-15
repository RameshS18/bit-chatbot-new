import os
import shutil
import time
from langchain_community.vectorstores import FAISS
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from langchain_community.document_loaders import DirectoryLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from core.constants import DOCUMENTS_DIR, FAISS_INDEX_DIR

class VectorStoreManager:
    """
    Manages the FAISS Vector Store.
    Updated to use the latest stable Google Embedding models.
    """
    
    def __init__(self):
        # We try 'models/text-embedding-004' first (Latest Standard)
        # If that fails, we try 'models/gemini-embedding-001' (What you found)
        self.model_candidates = [
            "models/text-embedding-004",
            "models/gemini-embedding-001"
        ]
        self.embeddings = self._initialize_embeddings()
        self.vectorstore = None
        self.retriever = None

    def _initialize_embeddings(self):
        """Tries to load a working embedding model."""
        for model in self.model_candidates:
            try:
                print(f"--- Attempting to load model: {model} ---")
                embeddings = GoogleGenerativeAIEmbeddings(model=model)
                # Test connection immediately
                embeddings.embed_query("test")
                print(f"Success! Using: {model}")
                return embeddings
            except Exception as e:
                print(f"Model {model} failed: {e}")
        
        print("CRITICAL ERROR: No embedding models worked. Check API Key.")
        return None

    def load_or_create_index(self):
        """Loads existing index or creates a new one."""
        if not self.embeddings:
            return None

        if os.path.exists(FAISS_INDEX_DIR):
            try:
                print("Loading FAISS index...")
                self.vectorstore = FAISS.load_local(FAISS_INDEX_DIR, self.embeddings, allow_dangerous_deserialization=True)
                # Self-Test to ensure index matches model
                self.vectorstore.similarity_search("test", k=1)
            except Exception:
                print("Index is incompatible or corrupt. Rebuilding...")
                self.rebuild_index()
        else:
            self.create_index()
        
        if self.vectorstore:
            self.retriever = self.vectorstore.as_retriever(search_kwargs={"k": 20})
        return self.retriever

    def create_index(self):
        """Reads documents and builds a new FAISS index."""
        if not self.embeddings:
            return

        print("Creating new FAISS index...")
        if not os.path.exists(DOCUMENTS_DIR):
            os.makedirs(DOCUMENTS_DIR)

        loader = DirectoryLoader(DOCUMENTS_DIR, glob="**/*.*", show_progress=True, use_multithreading=True, silent_errors=True)
        docs = loader.load()
        
        if not docs:
            print("No documents found. Creating empty index.")
            from langchain_core.documents import Document
            docs = [Document(page_content="Welcome to BIT Chatbot.", metadata={"source": "system"})]

        splitter = RecursiveCharacterTextSplitter(chunk_size=2000, chunk_overlap=300)
        texts = splitter.split_documents(docs)
        
        try:
            self.vectorstore = FAISS.from_documents(texts, self.embeddings)
            self.vectorstore.save_local(FAISS_INDEX_DIR)
            print("Index created successfully.")
        except Exception as e:
            print(f"Failed to create index: {e}")

    def rebuild_index(self):
        """Forces a rebuild."""
        if os.path.exists(FAISS_INDEX_DIR):
            try:
                shutil.rmtree(FAISS_INDEX_DIR)
                time.sleep(1) # Wait for file lock release
            except Exception:
                pass
        self.create_index()
        if self.vectorstore:
            self.retriever = self.vectorstore.as_retriever(search_kwargs={"k": 20})
        return True