# This file is the entry point for the Flask application. It creates the Flask app, initialises the database and runs the app.

from flask import Flask
from flask_migrate import Migrate
from models import db, User, Task, GitHubToken, GitHubRepository, TaskGitHubLink, Comment, Notification
from config import Config

def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)
    
    # Initialise Flask-SQLAlchemy
    db.init_app(app)
    
    # Initialise Flask-Migrate
    migrate = Migrate(app, db)
    
    @app.route('/')
    def index():
        return "DevSync API"
    
    return app

if __name__ == '__main__':
    app = create_app()
    app.run(debug=True)
