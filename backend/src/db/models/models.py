# This file contains the models for the database tables.

from datetime import datetime
from ..db_connection import db

# User-Project association table for many-to-many relationship
project_members = db.Table('project_members',
    db.Column('project_id', db.Integer, db.ForeignKey('projects.id'), primary_key=True),
    db.Column('user_id', db.Integer, db.ForeignKey('users.id'), primary_key=True)
)

class User(db.Model):
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(100), unique=True, nullable=False)
    password = db.Column(db.String(255), nullable=False)
    role = db.Column(db.String(20), nullable=False)
    github_username = db.Column(db.String(100))  # Add this line
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    created_tasks = db.relationship('Task', backref='creator', foreign_keys='Task.created_by')
    assigned_tasks = db.relationship('Task', backref='assignee', foreign_keys='Task.assigned_to')
    github_tokens = db.relationship('GitHubToken', backref='user', lazy=True)
    comments = db.relationship('Comment', backref='user', lazy=True)
    notifications = db.relationship('Notification', backref='user', lazy=True)
    projects = db.relationship('Project', secondary=project_members, backref='team_members', lazy='dynamic')

    def __repr__(self):
        return f'<User {self.name}>'

class Task(db.Model):
    __tablename__ = 'tasks'
    
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text)
    status = db.Column(db.String(20), nullable=False)
    progress = db.Column(db.Integer, default=0)
    assigned_to = db.Column(db.Integer, db.ForeignKey('users.id'))
    created_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    deadline = db.Column(db.DateTime)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    project_id = db.Column(db.Integer, db.ForeignKey('projects.id'))
    
    # Relationships
    github_links = db.relationship('TaskGitHubLink', backref='task', lazy=True)
    comments = db.relationship('Comment', backref='task', lazy=True)
    notifications = db.relationship('Notification', backref='task', lazy=True)

    def __repr__(self):
        return f'<Task {self.title}>'

class GitHubToken(db.Model):
    __tablename__ = 'github_tokens'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    access_token = db.Column(db.String(255), nullable=False)
    refresh_token = db.Column(db.String(255))
    token_expires_at = db.Column(db.DateTime)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def __repr__(self):
        return f'<GitHubToken {self.id} for User {self.user_id}>'

class GitHubRepository(db.Model):
    __tablename__ = 'github_repositories'
    
    id = db.Column(db.Integer, primary_key=True)
    repo_name = db.Column(db.String(255), nullable=False)
    repo_url = db.Column(db.String(255), nullable=False)
    github_id = db.Column(db.Integer)
    
    # Relationships
    task_links = db.relationship('TaskGitHubLink', backref='repository', lazy=True)

    def __repr__(self):
        return f'<GitHubRepository {self.repo_name}>'

class TaskGitHubLink(db.Model):
    __tablename__ = 'task_github_links'
    
    id = db.Column(db.Integer, primary_key=True)
    task_id = db.Column(db.Integer, db.ForeignKey('tasks.id'), nullable=False)
    repo_id = db.Column(db.Integer, db.ForeignKey('github_repositories.id'), nullable=False)
    issue_number = db.Column(db.Integer)
    pull_request_number = db.Column(db.Integer)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def __repr__(self):
        return f'<TaskGitHubLink task:{self.task_id} repo:{self.repo_id}>'

class Comment(db.Model):
    __tablename__ = 'comments'
    
    id = db.Column(db.Integer, primary_key=True)
    task_id = db.Column(db.Integer, db.ForeignKey('tasks.id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    content = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def __repr__(self):
        return f'<Comment {self.id} on Task {self.task_id}>'

class Notification(db.Model):
    __tablename__ = 'notifications'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    content = db.Column(db.Text, nullable=False)
    is_read = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    task_id = db.Column(db.Integer, db.ForeignKey('tasks.id'))

    def __repr__(self):
        return f'<Notification {self.id} for User {self.user_id}>'

class Project(db.Model):
    """Project model representing development projects"""
    __tablename__ = 'projects'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)
    status = db.Column(db.String(20), default='active')
    github_repo = db.Column(db.String(255))
    created_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    tasks = db.relationship('Task', backref='project', lazy=True)
    
    def __repr__(self):
        return f'<Project {self.name}>'
