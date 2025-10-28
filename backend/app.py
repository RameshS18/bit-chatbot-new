import os
import sys
import atexit
import sqlite3  # Import SQLite
from dotenv import load_dotenv
from datetime import datetime, date

# --- Flask Imports ---
from flask import Flask, request, jsonify
from flask_cors import CORS

# --- LangChain Imports ---
from langchain_community.document_loaders import DirectoryLoader
from langchain_community.vectorstores import FAISS
from langchain_community.embeddings import HuggingFaceBgeEmbeddings
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_core.prompts import PromptTemplate
from langchain_core.runnables import RunnablePassthrough
from langchain_core.output_parsers import StrOutputParser

# --- 1. Load Environment Variables ---
load_dotenv()
if "GOOGLE_API_KEY" not in os.environ:
    print("Error: GOOGLE_API_KEY not found in .env file.")
    sys.exit(1)

# --- 2. Define All Paths ---
# PLEASE UPDATE THESE PATHS to match your system
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DOCUMENTS_PATH = os.path.join(BASE_DIR, "documents")
EMBED_MODEL_PATH = os.path.join(BASE_DIR, "bge-base-en-v1.5")
FAISS_INDEX_PATH = os.path.join(BASE_DIR, "faiss_index")
DATABASE_DIR = os.path.join(BASE_DIR, "database")

# DB for escalated queries
ESCALATED_DB_PATH = os.path.join(DATABASE_DIR, "user_details.db")
# DB for user stats
USERS_DB_PATH = os.path.join(DATABASE_DIR, "all_users.db")


# --- 3. Initialize SQLite Databases ---
def setup_databases():
    """
    Creates the 'database' directory and initializes both database tables
    if they don't already exist.
    """
    try:
        os.makedirs(DATABASE_DIR, exist_ok=True)
        print(f"Database directory ensure_exists: {DATABASE_DIR}")

        # --- DB 1: Escalated User Details ---
        conn_details = sqlite3.connect(ESCALATED_DB_PATH)
        cursor_details = conn_details.cursor()
        cursor_details.execute("""
        CREATE TABLE IF NOT EXISTS escalated_queries (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp TEXT NOT NULL,
            user_name TEXT,
            email TEXT,
            phone_number TEXT,
            query_text TEXT NOT NULL,
            bot_response TEXT NOT NULL,
            status TEXT NOT NULL,
            remarks TEXT
        )
        """)
        conn_details.commit()
        conn_details.close()
        print(f"Escalated queries database initialized: {ESCALATED_DB_PATH}")

        # --- DB 2: All User Stats ---
        conn_users = sqlite3.connect(USERS_DB_PATH)
        cursor_users = conn_users.cursor()
        cursor_users.execute("""
        CREATE TABLE IF NOT EXISTS all_users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_name TEXT,
            email TEXT UNIQUE,
            phone_number TEXT,
            first_seen TEXT NOT NULL,
            last_seen TEXT NOT NULL
        )
        """)
        conn_users.commit()
        conn_users.close()
        print(f"All users database initialized: {USERS_DB_PATH}")

    except Exception as e:
        print(f"Error initializing SQLite databases: {e}")
        sys.exit(1)

# Run the database setup function on startup
setup_databases()

# --- 4. Initialize Embedding Model ---
print("Initializing BGE embedding model...")
try:
    embedding_model = HuggingFaceBgeEmbeddings(
        model_name=EMBED_MODEL_PATH,
        model_kwargs={'device': 'cpu'},
        encode_kwargs={'normalize_embeddings': True}
    )
    print("Embedding model loaded.")
except Exception as e:
    print(f"Error loading embedding model: {e}")
    sys.exit(1)

# --- 5. MODIFIED: Setup the Vector Database (FAISS) ---
def get_or_create_faiss_index():
    """
    Loads an existing FAISS index from disk if it exists.
    If not, it reads all documents from DOCUMENTS_PATH (including sub-folders),
    creates embeddings, builds a FAISS index, and saves it to disk.
    """
    if os.path.exists(FAISS_INDEX_PATH):
        print(f"Loading existing FAISS index from: {FAISS_INDEX_PATH}")
        try:
            # Note: allow_dangerous_deserialization is required for loading FAISS indexes
            vectorstore = FAISS.load_local(
                FAISS_INDEX_PATH, 
                embedding_model,
                allow_dangerous_deserialization=True
            )
            print("FAISS index loaded successfully.")
            return vectorstore
        except Exception as e:
            print(f"Error loading FAISS index: {e}. Re-creating...")
            # Fallback to re-creating if loading fails
            pass
    
    # If index doesn't exist or loading failed, create a new one
    print("Creating new FAISS index...")
    print(f"Loading documents from: {DOCUMENTS_PATH}")
    
    # This glob="**/*.*" pattern reads ALL files in the root folder
    # AND all files in ANY sub-folder (like 'departments').
    loader = DirectoryLoader(
        DOCUMENTS_PATH, 
        glob="**/*.*",  # This ensures recursive loading
        show_progress=True, 
        use_multithreading=True,
        silent_errors=True # Skip files it can't read (e.g., system files)
    )
    
    documents = loader.load()
    
    if not documents:
        print(f"No documents found in {DOCUMENTS_PATH}. Please add files to this folder and its sub-folders.")
        sys.exit(1)
        
    print(f"Successfully loaded {len(documents)} documents.")

    # This splitter breaks documents "deeply" into manageable chunks
    text_splitter = RecursiveCharacterTextSplitter(chunk_size=2000, chunk_overlap=300)
    texts = text_splitter.split_documents(documents)
    
    print(f"Split documents into {len(texts)} chunks.")
    
    print("Creating FAISS vector store...")
    vectorstore = FAISS.from_documents(
        documents=texts, 
        embedding=embedding_model
    )
    
    print(f"Saving FAISS index to: {FAISS_INDEX_PATH}")
    vectorstore.save_local(FAISS_INDEX_PATH)
    
    print("FAISS index created and saved successfully.")
    return vectorstore

# --- 6. Initialize the RAG Chain ---
print("Setting up the RAG chain...")
vectorstore = get_or_create_faiss_index()

# ---
# --- THIS IS THE CRITICAL CHANGE ---
# ---
# We now retrieve the top 30 chunks, not just 3.
retriever = vectorstore.as_retriever(search_kwargs={"k": 30})
# ---
# --- END OF CHANGE ---
# ---

llm = ChatGoogleGenerativeAI(model="gemini-2.5-flash", temperature=0.3)

template = """
You are **BIT Bot**, the official virtual assistant of **Bannari Amman Institute of Technology (BIT)**.

You combine **RAG (Retrieval-Augmented Generation)** with **Gemini API** to give clear, correct, and polite answers.

Your job is to first check **whether the question is related to BIT College or the provided documents**.

────────────────────────────
 MAIN LOGIC:
────────────────────────────
1. **If the query is related to BIT or present in the document context:**
   - Read the context retrieved from **FAISS Vector Store** carefully.
   - Answer **only using that context**.
   - Do not use external or general knowledge.
   - Format neatly with bold keywords, bullet points, or short numbered steps.
   - Keep it short, clear, and professional.

2. **If the query is NOT related to BIT or not covered in the document:**
   - Use the **Gemini API’s general knowledge** to answer politely.
   - Keep your tone conversational, brief, and friendly.

────────────────────────────
 COLLEGE-SPECIFIC RULES:
────────────────────────────
- If the query is completely unrelated to BIT, say exactly:
  "I’m the official assistant of Bannari Amman Institute of Technology. Please ask questions related to BIT College."

- If the information is missing in the BIT documents or database, say exactly:
  "We have received your query, soon our concerned department will contact you. Thank You!"

────────────────────────────
 GENERAL BEHAVIOR RULES:
────────────────────────────
- If the user greets or asks who you are, reply:
  “I’m BIT Bot, the official assistant of Bannari Amman Institute of Technology. How can I help you today?”

- Be polite, disciplined, and respectful.
- Never generate false or assumed answers.
- Do not restate the user’s question.
- Use short sentences and structured formatting.

────────────────────────────
 ANSWER FORMAT:
────────────────────────────
- Use **bold** for important keywords.
- Use short **dot points (•)** for listing information.
- For step-based explanations (e.g., admission, procedures), use **1–5 numbered steps**.
- For any official references or links, use this style (without backticks):
  **You can find it at [https://www.bitsathy.ac.in](https://www.bitsathy.ac.in)**

Format neatly with bold keywords, bullet points, or short numbered steps. (This enforces structure.)

Keep it short, clear, and professional. (This enforces brevity and clarity.)

Use short sentences and structured formatting. (This reinforces scannability.)

Respond in a structured, short, and crisp format — all details must be accurate and relevant. (This is the final summary instruction.)

────────────────────────────
 SYSTEM ROLE:
────────────────────────────
You are a **helpful and context-aware assistant** for BIT.
You use **FAISS embeddings** to read documents when the question is BIT-related.
You use **Gemini API knowledge** when the query is general or outside BIT’s scope.

Respond in a **structured, short, and crisp** format — all details must be accurate and relevant.

BEHAVIOR RULES:
        1. College relevance check: If the user’s question is not related to BIT, reply exactly: "I’m the official assistant of Bannari Amman Institute of Technology. Please ask questions related to BIT College."
        2. Use ONLY the provided Context. Do NOT use outside knowledge. Your answer must be based on the retrieved documents:
           • **If the Context confirms the information:** Provide the answer directly from the context.
           • **If the Context denies the information:** You must state that it is not available. (Example: If the user asks for "Aerospace Department" and the context lists all departments *without* Aerospace, you must reply: "The Aerospace department is not available at BIT.")
           • **If the Context is missing or irrelevant:** Only if the context truly does not have the information to confirm or deny the query, reply exactly: "We have received your query, soon our concerned department will contact you. Thank You!"
        3. General questions: If the user greets you or asks who you are, respond politely: “I’m BIT Bot, the official assistant of Bannari Amman Institute of Technology. How can I help you today?”

CONTEXT:
{context}

QUESTION:
{question}

ANSWER:
"""
prompt_template = PromptTemplate.from_template(template)

def format_docs(docs):
    return "\n\n".join(doc.page_content for doc in docs)

rag_chain = (
    {"context": retriever | format_docs, "question": RunnablePassthrough()}
    | prompt_template
    | llm
    | StrOutputParser()
)
print("RAG chain is ready.")

# --- 7. Create Flask App ---
app = Flask(__name__)
CORS(app) 
print("Flask app created with CORS enabled.")

# --- 8. Helper Function to update user's 'last_seen' timestamp ---
def update_user_last_seen(email):
    """Updates the last_seen timestamp for a user based on their email."""
    try:
        timestamp = datetime.now().isoformat()
        conn = sqlite3.connect(USERS_DB_PATH)
        cursor = conn.cursor()
        cursor.execute(
            "UPDATE all_users SET last_seen = ? WHERE email = ?",
            (timestamp, email)
        )
        conn.commit()
        conn.close()
        print(f"Updated last_seen for user: {email}")
    except Exception as e:
        print(f"Error updating last_seen for {email}: {e}")


# --- 9. NEW Endpoint: User Login/Registration ---
@app.route('/login', methods=['POST'])
def login_user():
    """
    Logs a user in. If they are new (based on email), adds them to the
    all_users table. Otherwise, just updates their last_seen timestamp.
    """
    try:
        data = request.json
        user_name = data.get('name')
        email = data.get('email')
        phone = data.get('phone')

        if not email:
            return jsonify({"error": "Email is required"}), 400

        timestamp = datetime.now().isoformat()
        conn = sqlite3.connect(USERS_DB_PATH)
        cursor = conn.cursor()
        
        # Check if user exists
        cursor.execute("SELECT id FROM all_users WHERE email = ?", (email,))
        user = cursor.fetchone()
        
        if user:
            # User exists, update last_seen
            cursor.execute(
                "UPDATE all_users SET last_seen = ? WHERE email = ?",
                (timestamp, email)
            )
            print(f"Existing user logged in: {email}")
            message = "User updated"
        else:
            # New user, insert them
            cursor.execute(
                """
                INSERT INTO all_users (user_name, email, phone_number, first_seen, last_seen)
                VALUES (?, ?, ?, ?, ?)
                """,
                (user_name, email, phone, timestamp, timestamp)
            )
            print(f"New user registered: {email}")
            message = "User registered"

        conn.commit()
        conn.close()
        return jsonify({"status": "success", "message": message})

    except sqlite3.IntegrityError:
        # This handles a rare race condition, acts like an update
        conn.close()
        update_user_last_seen(email)
        return jsonify({"status": "success", "message": "User updated"})
    except Exception as e:
        print(f"Error in /login: {e}")
        return jsonify({"error": "An internal server error occurred"}), 500


# --- 10. Chatbot API Route (Updated) ---
@app.route('/chat', methods=['POST'])
def chat():
    try:
        data = request.json
        query = data.get('query')
        
        # Get all user details from frontend
        user_name = data.get('user_name')
        email = data.get('email')
        phone_number = data.get('phone_number')

        if not query or not email:
            return jsonify({"error": "Query and email are required"}), 400
        
        # Update user's last_seen timestamp on every message
        update_user_last_seen(email)

        print(f"\nReceived query from {email}: {query}")

        # Get the answer from the RAG chain
        answer = rag_chain.invoke(query)
        print(f"Generated answer: {answer}")

        # --- Conditional Logging to SQLite ---
        trigger_message = "We have received your query, soon our concerned department will contact you. Thank You!"
        
        if answer.strip() == trigger_message:
            print("Trigger message detected! Saving to escalated_queries.db...")
            try:
                timestamp = datetime.now().isoformat()
                conn_details = sqlite3.connect(ESCALATED_DB_PATH)
                cursor_details = conn_details.cursor()
                
                cursor_details.execute(
                    """
                    INSERT INTO escalated_queries (timestamp, user_name, email, phone_number, query_text, bot_response, status, remarks) 
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                    """,
                    (
                        timestamp,
                        user_name if user_name else 'Not Provided',
                        email if email else 'Not Provided',
                        phone_number if phone_number else 'Not Provided',
                        query,
                        answer,
                        "Initiated",  # NEW: Default status
                        ""            # NEW: Default remarks
                    )
                )
                conn_details.commit()
                conn_details.close()
                print("Escalated query saved successfully.")

            except Exception as e:
                print(f"Error logging to escalated_queries.db: {e}")
                
        else:
            print("Standard response. Not saving to escalated database.")
        
        return jsonify({"answer": answer})

    except Exception as e:
        print(f"An error occurred in the /chat route: {e}")
        return jsonify({"error": "An internal server error occurred"}), 500


# --- 11. NEW Admin Endpoints ---

@app.route('/admin/stats', methods=['GET'])
def get_admin_stats():
    """
    Provides dashboard stats:
    1. Total Unique Users (from all_users table)
    2. Today's "Live" Users (users with a last_seen today)
    3. Total Escalated Queries (from escalated_queries table)
    4. Total Solved Queries (queries with status 'Finished')
    """
    try:
        conn_users = sqlite3.connect(USERS_DB_PATH)
        cursor_users = conn_users.cursor()
        
        # 1. Total Unique Users
        cursor_users.execute("SELECT COUNT(id) FROM all_users")
        total_unique_users = cursor_users.fetchone()[0]
        
        # 2. Today's Users
        today_str = str(date.today())
        cursor_users.execute("SELECT COUNT(id) FROM all_users WHERE last_seen LIKE ?", (today_str + '%',))
        today_users = cursor_users.fetchone()[0]
        conn_users.close()
        
        # 3. Total Escalated Queries & 4. Total Solved Queries
        conn_details = sqlite3.connect(ESCALATED_DB_PATH)
        cursor_details = conn_details.cursor()
        
        cursor_details.execute("SELECT COUNT(id) FROM escalated_queries WHERE status = 'Initiated'")
        total_escalated = cursor_details.fetchone()[0]
        
        cursor_details.execute("SELECT COUNT(id) FROM escalated_queries WHERE status = 'Finished'")
        total_solved = cursor_details.fetchone()[0]
        
        conn_details.close()

        stats = {
            "totalUniqueUsers": total_unique_users,
            "todayUsers": today_users,
            "totalEscalated": total_escalated,
            "totalSolved": total_solved
        }
        return jsonify(stats)
        
    except Exception as e:
        print(f"Error in /admin/stats: {e}")    
        return jsonify({"error": "An internal server error occurred"}), 500

@app.route('/admin/escalated-queries', methods=['GET'])
def get_escalated_queries():
    """Fetches all escalated queries, newest first."""
    try:
        conn = sqlite3.connect(ESCALATED_DB_PATH)
        # Make rows returned as dictionaries
        conn.row_factory = sqlite3.Row 
        cursor = conn.cursor()
        
        # Fetch newest first
        cursor.execute("SELECT * FROM escalated_queries ORDER BY timestamp DESC")
        rows = cursor.fetchall()
        
        # Convert row objects to dictionaries
        queries = [dict(row) for row in rows]
        
        conn.close()
        return jsonify(queries)
        
    except Exception as e:
        print(f"Error in /admin/escalated-queries: {e}")
        return jsonify({"error": "An internal server error occurred"}), 500


@app.route('/admin/all-users', methods=['GET'])
def get_all_users():
    """Fetches all users from the all_users table, newest first."""
    try:
        conn = sqlite3.connect(USERS_DB_PATH)
        # Make rows returned as dictionaries
        conn.row_factory = sqlite3.Row 
        cursor = conn.cursor()
        
        # Fetch newest seen first
        cursor.execute("SELECT * FROM all_users ORDER BY last_seen DESC")
        rows = cursor.fetchall()
        
        # Convert row objects to dictionaries
        users = [dict(row) for row in rows]
        
        conn.close()
        return jsonify(users)
        
    except Exception as e:
        print(f"Error in /admin/all-users: {e}")
        return jsonify({"error": "An internal server error occurred"}), 500


@app.route('/admin/update-query/<int:query_id>', methods=['PUT'])
def update_escalated_query(query_id):
    """Updates the status and remarks for an escalated query."""
    try:
        data = request.json
        status = data.get('status')
        remarks = data.get('remarks')
        
        if not status or remarks is None:
            return jsonify({"error": "Status and remarks are required"}), 400
            
        conn = sqlite3.connect(ESCALATED_DB_PATH)
        cursor = conn.cursor()
        cursor.execute(
            "UPDATE escalated_queries SET status = ?, remarks = ? WHERE id = ?",
            (status, remarks, query_id)
        )
        conn.commit()
        
        # Check if update was successful
        if cursor.rowcount == 0:
            conn.close()
            return jsonify({"error": "Query not found"}), 404
            
        conn.close()
        print(f"Updated query ID {query_id} to status {status}")
        return jsonify({"status": "success", "message": "Query updated"})
        
    except Exception as e:
        print(f"Error in /admin/update-query: {e}")
        return jsonify({"error": "An internal server error occurred"}), 500
    
# --- NEW ENDPOINT: Get escalated users grouped ---
@app.route('/admin/escalated-users', methods=['GET'])
def get_escalated_users():
    """
    Fetches unique users who have escalated queries,
    along with the count of their escalated queries.
    """
    try:
        conn = sqlite3.connect(ESCALATED_DB_PATH)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT 
                user_name,
                email,
                phone_number,
                COUNT(*) as query_count
            FROM escalated_queries
            WHERE status = 'Initiated'
            GROUP BY email
            ORDER BY query_count DESC, user_name ASC
        """)
        
        rows = cursor.fetchall()
        users = [dict(row) for row in rows]
        
        conn.close()
        return jsonify(users)
        
    except Exception as e:
        print(f"Error in /admin/escalated-users: {e}")
        return jsonify({"error": "An internal server error occurred"}), 500


# --- NEW ENDPOINT: Get queries for a specific user ---
@app.route('/admin/user-queries/<email>', methods=['GET'])
def get_user_queries(email):
    """
    Fetches all escalated queries for a specific user email.
    """
    try:
        conn = sqlite3.connect(ESCALATED_DB_PATH)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT * FROM escalated_queries 
            WHERE email = ? 
            ORDER BY timestamp DESC
        """, (email,))
        
        rows = cursor.fetchall()
        queries = [dict(row) for row in rows]
        
        conn.close()
        return jsonify(queries)
        
    except Exception as e:
        print(f"Error in /admin/user-queries: {e}")
        return jsonify({"error": "An internal server error occurred"}), 500


# --- NEW ENDPOINT: Get solved queries ---
# --- NEW ENDPOINT: Get users with solved queries ---
@app.route('/admin/solved-users', methods=['GET'])
def get_solved_users():
    """
    Fetches unique users who have solved queries,
    along with the count of their solved queries.
    """
    try:
        conn = sqlite3.connect(ESCALATED_DB_PATH)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT 
                user_name,
                email,
                phone_number,
                COUNT(*) as query_count
            FROM escalated_queries
            WHERE status = 'Finished'
            GROUP BY email
            ORDER BY query_count DESC, user_name ASC
        """)
        
        rows = cursor.fetchall()
        users = [dict(row) for row in rows]
        
        conn.close()
        return jsonify(users)
        
    except Exception as e:
        print(f"Error in /admin/solved-users: {e}")
        return jsonify({"error": "An internal server error occurred"}), 500

# --- NEW ENDPOINT: Get today's users ---
@app.route('/admin/today-users', methods=['GET'])
def get_today_users():
    """
    Fetches all users who were active today.
    """
    try:
        today_str = str(date.today())
        
        conn = sqlite3.connect(USERS_DB_PATH)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT * FROM all_users 
            WHERE last_seen LIKE ? 
            ORDER BY last_seen DESC
        """, (today_str + '%',))
        
        rows = cursor.fetchall()
        users = [dict(row) for row in rows]
        
        conn.close()
        return jsonify(users)
        
    except Exception as e:
        print(f"Error in /admin/today-users: {e}")
        return jsonify({"error": "An internal server error occurred"}), 500


# --- 12. Run the Flask App ---
if __name__ == "__main__":
    print("\n--- BIT Chatbot Backend is Starting ---")
    print("Access the API at http://127.0.0.1:5000")
    app.run(debug=True, port=5000)