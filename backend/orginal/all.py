import os
import sys
from dotenv import load_dotenv

# --- LangChain Imports ---
from langchain_community.document_loaders import DirectoryLoader
from langchain_community.vectorstores import Chroma
from langchain_community.embeddings import HuggingFaceBgeEmbeddings
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.prompts import PromptTemplate
from langchain.schema.runnable import RunnablePassthrough
from langchain.schema.output_parser import StrOutputParser

# --- Load Environment Variables ---
# Make sure you have a .env file with your GOOGLE_API_KEY
load_dotenv()
if "GOOGLE_API_KEY" not in os.environ:
    print("Error: GOOGLE_API_KEY not found in .env file.")
    sys.exit(1)

# --- 1. Define Paths and Constants ---
# Use raw strings (r"...") for Windows paths to avoid issues with backslashes
DOCUMENTS_PATH = r"K:\bit chatbot\backend\documents"
EMBED_MODEL_PATH = r"K:\bit chatbot\backend\bge-base-en-v1.5"
CHROMA_DB_PATH = r"./chroma_db" # Will be created in your backend folder

# --- 2. Initialize the Embedding Model ---
# This uses the BGE model you downloaded locally
print("Initializing embedding model...")
embedding_model = HuggingFaceBgeEmbeddings(
    model_name=EMBED_MODEL_PATH,
    model_kwargs={'device': 'cpu'}, # Use 'cuda' if you have a GPU
    encode_kwargs={'normalize_embeddings': True}
)
print("Embedding model initialized.")

# --- 3. Setup the Vector Database (ChromaDB) ---
# This function handles loading documents and creating the vector store
def get_or_create_vectorstore():
    if os.path.exists(CHROMA_DB_PATH):
        # If the database already exists, just load it
        print(f"Loading existing vector store from: {CHROMA_DB_PATH}")
        return Chroma(
            persist_directory=CHROMA_DB_PATH,
            embedding_function=embedding_model
        )
    else:
        # If it's the first run, create the database
        print("Creating new vector store...")
        
        # Load all documents from the specified directory
        # This loader can handle various file types like .pdf, .docx, .txt
        print(f"Loading documents from: {DOCUMENTS_PATH}")
        loader = DirectoryLoader(DOCUMENTS_PATH, glob="**/*.*", show_progress=True)
        documents = loader.load()

        if not documents:
            print("No documents found. Please add documents to the 'documents' folder.")
            sys.exit(1)

        # Split the documents into smaller chunks
        text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)
        texts = text_splitter.split_documents(documents)
        
        print(f"Creating vector store and saving to: {CHROMA_DB_PATH}")
        vectorstore = Chroma.from_documents(
            documents=texts, 
            embedding=embedding_model,
            persist_directory=CHROMA_DB_PATH
        )
        print("Vector store created successfully.")
        return vectorstore

# --- 4. Initialize the RAG Chain ---
print("Setting up the RAG chain...")

# Get the vector store (either loaded or newly created)
vectorstore = get_or_create_vectorstore()

# Create a retriever to search the vector store
retriever = vectorstore.as_retriever(search_kwargs={"k": 3}) # Retrieve top 3 results

# Initialize the Gemini LLM
llm = ChatGoogleGenerativeAI(model="gemini-2.5-flash", temperature=0.3)

# Define the System Instruction / Prompt Template
template = """
SYSTEM INSTRUCTION:
You are a helpful assistant for the college. Your name is BIT-Bot.
Answer the user's question based ONLY on the following context.
If the context does not contain the answer, state that you don't have enough information.
Do not make up information. Be concise and professional.

CONTEXT:
{context}

QUESTION:
{question}

ANSWER:
"""
prompt_template = PromptTemplate.from_template(template)

# Helper function to format the retrieved documents
def format_docs(docs):
    return "\n\n".join(doc.page_content for doc in docs)

# Create the RAG chain using LangChain Expression Language (LCEL)
rag_chain = (
    {"context": retriever | format_docs, "question": RunnablePassthrough()}
    | prompt_template
    | llm
    | StrOutputParser()
)

print("\n--- BIT Chatbot is Ready ---")
print("Type your question and press Enter. Type 'exit' to quit.")

# --- 5. Start the Chatbot Loop ---
if __name__ == "__main__":
    while True:
        query = input("\nYou: ")
        if query.lower() == 'exit':
            print("Goodbye!")
            break
        if not query.strip():
            continue

        # Get the answer from the RAG chain
        answer = rag_chain.invoke(query)
        
        # Print only the answer
        print(f"BIT-Bot: {answer}")