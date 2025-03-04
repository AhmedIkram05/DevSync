"""
Entry point for running the DevSync Flask application
"""
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

from src.app import create_app

app = create_app()

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8000, debug=True)
