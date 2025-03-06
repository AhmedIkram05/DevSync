"""
Development server runner
"""
from dotenv import load_dotenv
import os
import sys

# Add the backend directory to sys.path
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from src.app import create_app

if __name__ == '__main__':
    # Load environment variables
    load_dotenv()
    
    # Create and run the app
    app = create_app()
    # Use port 5001 instead of 5000 to avoid conflicts with AirPlay on macOS
    port = int(os.environ.get("PORT", 5001))
    app.run(debug=True, host='0.0.0.0', port=port)
