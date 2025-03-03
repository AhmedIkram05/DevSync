# This file is the configuration file for the Flask application. It contains the configuration settings for the application, such as the database URI and secret key. The configuration settings are loaded from environment variables using the dotenv package.

import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    # Database configuration
    SQLALCHEMY_DATABASE_URI = os.getenv('DATABASE_URL', '')
    
    # Convert postgres:// to postgresql+psycopg2cffi:// for all URIs
    if SQLALCHEMY_DATABASE_URI:
        if SQLALCHEMY_DATABASE_URI.startswith('postgres://'):
            SQLALCHEMY_DATABASE_URI = SQLALCHEMY_DATABASE_URI.replace('postgres://', 'postgresql+psycopg2cffi://', 1)
        elif SQLALCHEMY_DATABASE_URI.startswith('postgresql://'):
            SQLALCHEMY_DATABASE_URI = SQLALCHEMY_DATABASE_URI.replace('postgresql://', 'postgresql+psycopg2cffi://', 1)
    
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SECRET_KEY = os.getenv('JWT_SECRET_KEY', 'dev-secret-key')
