"""
Database models package initialization.
Import and expose all models for easy access.
"""

from flask_sqlalchemy import SQLAlchemy

# Initialize the SQLAlchemy instance
db = SQLAlchemy()

# Import models to make them available when importing the package
from .models import User, Task, Project, Comment, GitHubToken, GitHubRepository, TaskGitHubLink, Notification

# Export all models for easy importing
__all__ = [
    'db',
    'User',
    'Task',
    'Project',
    'Comment',
    'Notification',
    'GitHubToken',
    'GitHubRepository',
    'TaskGitHubLink'
]
