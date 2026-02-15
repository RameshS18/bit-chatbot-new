from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import PromptTemplate
from langchain_core.runnables import RunnablePassthrough
from langchain_core.output_parsers import StrOutputParser
from core.constants import CHATBOT_SYSTEM_PROMPT, CLASSIFIER_PROMPT

class LLMClient:
    """
    Wrapper for Gemini and RAG Chains.
    Includes safety checks for missing retrievers.
    """
    
    def __init__(self, retriever):
        self.llm = ChatGoogleGenerativeAI(model="gemini-2.5-flash", temperature=0.3)
        self.retriever = retriever
        
        # Build chains (Safe initialization)
        self.rag_chain = self._build_rag_chain()
        self.classifier_chain = self._build_classifier_chain()

    def _build_rag_chain(self):
        # FIX: If retriever is missing (due to embedding error), return None instead of crashing
        if not self.retriever:
            print("Warning: Retriever is None. RAG will be disabled.")
            return None

        prompt = PromptTemplate.from_template(CHATBOT_SYSTEM_PROMPT)
        
        def format_docs(docs):
            return "\n\n".join(doc.page_content for doc in docs)

        return (
            {"context": self.retriever | format_docs, "question": RunnablePassthrough()}
            | prompt
            | self.llm
            | StrOutputParser()
        )

    def _build_classifier_chain(self):
        prompt = PromptTemplate.from_template(CLASSIFIER_PROMPT)
        return prompt | self.llm | StrOutputParser()

    def get_answer(self, query):
        """Gets the answer from the RAG chain."""
        if not self.rag_chain:
            return "System Error: Knowledge base failed to load. Please contact admin."
            
        return self.rag_chain.invoke(query)

    def classify_query(self, query):
        """Classifies the query."""
        try:
            category = self.classifier_chain.invoke({"query": query})
            clean = category.strip().replace(".", "")
            valid = ["Admission", "Hostel", "Campus-Facility", "Placement", "General"]
            return clean if clean in valid else "General"
        except Exception:
            return "General"