# This file is the entry point for the Flask application.

import os
import sys

# Add the backend directory to the Python path
backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "../"))
sys.path.insert(0, backend_dir)

# Handle both relative imports for package and absolute imports for direct execution
if __name__ == '__main__':
    from src.db.models import db
    from src.config.config import get_config
    from src.api import init_app as init_api
    from src.api.middlewares import setup_middlewares
    from src.socketio_server import init_socketio
else:
    from .db.models import db
    from .config.config import get_config
    from .api import init_app as init_api
    from .api.middlewares import setup_middlewares
    from .socketio_server import init_socketio

from datetime import timedelta
from flask import Flask
from flask_migrate import Migrate
from flask_jwt_extended import JWTManager
from flask_cors import CORS

def create_app(config_class=None):
    app = Flask(__name__)
    app.config.from_object(config_class or get_config())
    
    # JWT Configuration
    app.config["JWT_ACCESS_TOKEN_EXPIRES"] = timedelta(minutes=int(app.config.get("ACCESS_TOKEN_EXPIRE_MINUTES", 30)))
    app.config["JWT_REFRESH_TOKEN_EXPIRES"] = timedelta(days=30)
    app.config["JWT_TOKEN_LOCATION"] = ["cookies", "headers"]
    app.config["JWT_COOKIE_SECURE"] = False  # Set to True in production with HTTPS
    app.config["JWT_COOKIE_CSRF_PROTECT"] = True
    app.config["JWT_COOKIE_SAMESITE"] = "Lax"  # Recommended for CSRF protection
    
    # Initialize extensions
    db.init_app(app)
    migrate = Migrate(app, db)
    jwt = JWTManager(app)
    CORS(app)
    
    # Initialize API routes (including auth routes)
    init_api(app)
    
    # Setup middlewares (error handlers, logging, rate limiting)
    setup_middlewares(app)
    
    # Initialize Socket.IO
    socketio = init_socketio(app)
    
    @app.route('/')
    def index():
        return "DevSync API is running"
    
    return app, socketio

if __name__ == '__main__':
    app, socketio = create_app()
    # Use socketio.run instead of app.run
    socketio.run(app, debug=True, host='0.0.0.0', port=8000)
