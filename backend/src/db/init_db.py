"""
Database initialization script.
Run this to create database tables from scratch.
"""
import os
import sys
# Add the backend directory to the Python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../../")))

from flask import Flask
from .db_connection import db  # Changed to relative import
from .models import *  # Changed to relative import
from ..config.config import get_config  # Changed to relative import

def init_database():
    """Initialize the database with all tables"""
    app = Flask(__name__)
    app.config.from_object(get_config())
    db.init_app(app)
    
    with app.app_context():
        db.create_all()
        print("Database tables created successfully")

if __name__ == "__main__":
    init_database()
