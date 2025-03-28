# This file is the entry point for the Flask application.

import os
import sys
from dotenv import load_dotenv

from flask_swagger_ui import get_swaggerui_blueprint
import yaml 

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
from flask import Flask, request, jsonify, make_response
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

    # Swagger UI Setup
    SWAGGER_URL = "/api/docs"
    API_DOCS_PATH = "api/swagger.yaml"

    with open(API_DOCS_PATH, "r") as file:
        swagger_yaml = yaml.safe_load(file)

    swaggerui_blueprint = get_swaggerui_blueprint(
        SWAGGER_URL,  # URL to access Swagger UI
        API_DOCS_PATH,  # API docs path (can be a file or a URL)
        config={"app_name": "DevSync API"}
    )

    app.register_blueprint(swaggerui_blueprint, url_prefix=SWAGGER_URL)

    @app.route("/api/swagger.yaml")
    def swagger_yaml():
        return jsonify(swagger_yaml)
    
    # Configure database
    app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL', 'sqlite:///devsync.db')
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    
    # Configure JWT
    app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY', 'your-super-secret-key-for-development-only')
    app.config["JWT_ACCESS_TOKEN_EXPIRES"] = timedelta(minutes=int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "60")))
    app.config["JWT_REFRESH_TOKEN_EXPIRES"] = timedelta(days=30)
    app.config["JWT_TOKEN_LOCATION"] = ["cookies", "headers"]
    
    app.config["JWT_COOKIE_SECURE"] = True
    app.config["JWT_COOKIE_CSRF_PROTECT"] = False
    app.config["JWT_COOKIE_SAMESITE"] = None
    
    # Apply any override configurations
    if config_class:
        app.config.update(config_class)
    
    # Initialize extensions
    db.init_app(app)
    migrate = Migrate(app, db)
    jwt = JWTManager(app)
    
    CORS(app, 
         supports_credentials=True,
         allow_headers=["Content-Type", "Authorization", "X-Requested-With"],
         methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
         origins=["http://localhost:3000", "http://127.0.0.1:3000"],
         expose_headers=["Content-Type", "Authorization"],
         max_age=600)
    
    @app.after_request
    def add_cors_headers(response):
        # Only add headers if they don't already exist
        origin = request.headers.get('Origin')
        if origin in ["http://localhost:3000", "http://127.0.0.1:3000"]:
            # Check if header already exists (added by Flask-CORS)
            if 'Access-Control-Allow-Origin' not in response.headers:
                response.headers.add('Access-Control-Allow-Origin', origin)
            if 'Access-Control-Allow-Headers' not in response.headers:
                response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
            if 'Access-Control-Allow-Methods' not in response.headers:
                response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS,PATCH')
            if 'Access-Control-Allow-Credentials' not in response.headers:
                response.headers.add('Access-Control-Allow-Credentials', 'true')
            if 'Access-Control-Max-Age' not in response.headers:
                response.headers.add('Access-Control-Max-Age', '600')
        return response

    # Simplify options handler to prevent duplicate headers
    @app.route('/', methods=['OPTIONS'])
    @app.route('/<path:path>', methods=['OPTIONS'])
    def options_handler(path=None):
        response = make_response()
        # We don't add CORS headers here, the after_request will handle it
        return response
    
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
        '/api/v1/github/callback',
        '/api/v1/github/exchange',
        '/api/v1/github/connect'
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
