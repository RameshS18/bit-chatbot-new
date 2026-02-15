from api import create_app
from core.config import Config

app = create_app()

if __name__ == "__main__":
    print(f"\n--- BIT Chatbot Backend Started on Port {Config.PORT} ---")
    app.run(debug=Config.DEBUG_MODE, port=Config.PORT)