# This file is the entry point for the Flask application.

from datetime import timedelta
from flask import Flask
from flask_migrate import Migrate
from flask_jwt_extended import JWTManager
from models import db, User, Task, GitHubToken, GitHubRepository, TaskGitHubLink, Comment, Notification
from config import Config
from routes.auth import auth_bp
from routes.tasks import tasks_bp
from routes.admin import admin_bp

def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)
    
    # JWT Configuration
    app.config["JWT_SECRET_KEY"] = app.config["SECRET_KEY"]
    app.config["JWT_ACCESS_TOKEN_EXPIRES"] = timedelta(minutes=30)
    app.config["JWT_REFRESH_TOKEN_EXPIRES"] = timedelta(days=30)
    app.config["JWT_TOKEN_LOCATION"] = ["cookies"]
    app.config["JWT_COOKIE_SECURE"] = False  # Set to True in production with HTTPS
    app.config["JWT_COOKIE_CSRF_PROTECT"] = True
    app.config["JWT_COOKIE_SAMESITE"] = "Lax"  # Recommended for CSRF protection
    
    # Initialize extensions
    db.init_app(app)
    migrate = Migrate(app, db)
    jwt = JWTManager(app)
    
    # Register blueprints
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(tasks_bp, url_prefix='/api/tasks')
    app.register_blueprint(admin_bp, url_prefix='/api/admin')
    
    @app.route('/')
    def index():
        return "DevSync API"
    
    return app

if __name__ == '__main__':
    app = create_app()
    app.run(debug=True)
