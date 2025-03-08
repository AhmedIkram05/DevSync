"""
Development server runner
"""
from dotenv import load_dotenv
import os
import sys

# Add the backend directory to sys.path
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from src.app import create_app

# Create Flask application with Socket.IO
app, socketio = create_app()

if __name__ == '__main__':
    # Load environment variables
    load_dotenv()
    
    # Use socketio.run instead of app.run
    socketio.run(app, debug=True, host='0.0.0.0', port=8000)
