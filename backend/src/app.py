# This file is the entry point for the Flask application.

import os
import sys
from dotenv import load_dotenv

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
from flask import Flask, request, jsonify
from flask_migrate import Migrate
from flask_jwt_extended import JWTManager
from flask_cors import CORS

# Load environment variables
load_dotenv()

def log_routes(app):
    """Print all registered routes for debugging"""
    print("\nRegistered Routes:")
    for rule in app.url_map.iter_rules():
        print(f"Route: {rule.rule}, Methods: {rule.methods}")

def create_app(config_class=None):
    app = Flask(__name__)
    app.config.from_object(config_class or get_config())
    
    # Configure database
    app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL', 'sqlite:///devsync.db')
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    
    # Configure JWT
    app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY', 'your-super-secret-key-for-development-only')
    app.config["JWT_ACCESS_TOKEN_EXPIRES"] = timedelta(minutes=int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "60")))
    app.config["JWT_REFRESH_TOKEN_EXPIRES"] = timedelta(days=30)
    app.config["JWT_TOKEN_LOCATION"] = ["cookies", "headers"]
    
    # Fix for JWT cookies when running in development
    app.config["JWT_COOKIE_SECURE"] = False
    app.config["JWT_COOKIE_CSRF_PROTECT"] = False  # Disable CSRF for easier development
    app.config["JWT_COOKIE_SAMESITE"] = None
    
    # Apply any override configurations
    if config_class:
        app.config.update(config_class)
    
    # Initialize extensions
    db.init_app(app)
    migrate = Migrate(app, db)
    jwt = JWTManager(app)
    
    # Enhanced CORS configuration
    CORS(app, supports_credentials=True, resources={
        r"/*": {
            "origins": ["http://localhost:3000", "http://127.0.0.1:3000"], 
            "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
            "allow_headers": ["Content-Type", "Authorization", "X-Requested-With"]
        }
    })
    
    # JWT error handlers
    @jwt.expired_token_loader
    def expired_token_callback(jwt_header, jwt_payload):
        return {
            'status': 401,
            'message': 'The authentication token has expired',
            'error': 'token_expired'
        }, 401

    @jwt.invalid_token_loader
    def invalid_token_callback(error):
        return {
            'status': 401,
            'message': 'Invalid authentication token',
            'error': 'token_invalid'
        }, 401

    @jwt.unauthorized_loader
    def missing_token_callback(error):
        return {
            'status': 401,
            'message': 'Authentication token is missing',
            'error': 'authorization_required'
        }, 401
    
    # Modified exempt function to correctly bypass JWT and auth checks for public routes
    @jwt.token_in_blocklist_loader
    def check_if_token_is_revoked(jwt_header, jwt_payload):
        return False
    
    # Define public routes that don't need authentication
    public_routes = [
        '/',
        '/api/v1/auth/register',
        '/api/v1/auth/login',
    ]
    
    # Middleware to remove Flask-JWT auth requirements for public routes
    @app.before_request
    def handle_auth_exemptions():
        endpoint = request.endpoint
        path = request.path
        
        # Debug logging for route access
        print(f"Request to path: {path}, endpoint: {endpoint}")
        
        # Skip JWT verification for OPTIONS requests and public routes
        if request.method == 'OPTIONS' or any(path.startswith(route) for route in public_routes):
            print(f"Skipping auth for: {path}")
            return None
    
    # Initialize API routes (including auth routes)
    init_api(app)
    
    # Setup middlewares (error handlers, logging, rate limiting)
    setup_middlewares(app)
    
    # Log all routes (replacement for before_first_request)
    with app.app_context():
        log_routes(app)
    
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
