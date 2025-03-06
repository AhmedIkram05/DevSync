"""
Database connection module that provides the SQLAlchemy database instance
"""
from flask_sqlalchemy import SQLAlchemy

# Create a single SQLAlchemy instance to be used across the application
db = SQLAlchemy()
