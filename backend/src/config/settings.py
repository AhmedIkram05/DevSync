# This file contains the configuration settings for the Flask app.

import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY', 'dev-key-for-development-only')
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL', 'sqlite:///devsync.db')
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    DEBUG = False
    TESTING = False
    
    # GitHub OAuth Configuration - Ensure these match your GitHub OAuth app settings
    GITHUB_CLIENT_ID = os.environ.get('GITHUB_CLIENT_ID', 'Ov23liNLhQnblKq9d1zt')
    GITHUB_CLIENT_SECRET = os.environ.get('GITHUB_CLIENT_SECRET', '7499b06ba0b0661e28ac4cf9ac5f28218156c6fc')
    # CRITICAL: This MUST match the callback URL in your GitHub OAuth app settings EXACTLY
    GITHUB_REDIRECT_URI = os.environ.get('GITHUB_REDIRECT_URI', 'http://localhost:8000/api/v1/github/callback')
    FRONTEND_URL = os.environ.get('FRONTEND_URL', 'http://localhost:3000')

class DevelopmentConfig(Config):
    DEBUG = True

class ProductionConfig(Config):
    DEBUG = False

class TestConfig(Config):
    TESTING = True
    SQLALCHEMY_DATABASE_URI = 'sqlite:///:memory:'
    SECRET_KEY = 'test-key'
    WTF_CSRF_ENABLED = False
    JWT_COOKIE_SECURE = False

def get_config():
    env = os.environ.get('FLASK_ENV', 'development')
    
    if env == 'production':
        return ProductionConfig
    elif env == 'testing':
        return TestConfig
    else:
        return DevelopmentConfig
