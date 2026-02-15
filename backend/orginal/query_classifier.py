import os
from dotenv import load_dotenv
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import PromptTemplate
from langchain_core.output_parsers import StrOutputParser

# Load Environment Variables
load_dotenv()

# Check for API Key
if "GOOGLE_API_KEY" not in os.environ:
    print("Error: GOOGLE_API_KEY not found in .env file for classifier.")

# Initialize Gemini Model (Low temperature for strict classification)
llm = ChatGoogleGenerativeAI(model="gemini-2.5-flash", temperature=0.5)

# Define the Prompt
template = """
You are a strict query classifier for a college chatbot.
Analyze the following user query and classify it into EXACTLY ONE of these 5 categories:

1. Admission
2. Hostel
3. Campus-Facility
4. Placement
5. General (Use this if it doesn't fit the above 4)

**Rules:**
- Return ONLY the category name.
- Do not add punctuation or explanation.
- Example Output: Hostel

**User Query:** {query}

**Category:**
"""

prompt = PromptTemplate.from_template(template)
classifier_chain = prompt | llm | StrOutputParser()

def classify_user_query(query_text):
    """
    Classifies the user query into one of 5 categories.
    """
    try:
        # Run the chain
        category = classifier_chain.invoke({"query": query_text})
        
        # Clean up the output (remove whitespace/newlines)
        clean_category = category.strip().replace("\n", "").replace(".", "")
        
        # Validation fallback
        valid_categories = ["Admission", "Hostel", "Campus-Facility", "Placement", "General"]
        if clean_category not in valid_categories:
            return "General"
            
        return clean_category
    except Exception as e:
        print(f"Classification Error: {e}")
        return "General"