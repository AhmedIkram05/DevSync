"""API middlewares package initialization"""

from functools import wraps
from flask import jsonify
from flask_jwt_extended import get_jwt, verify_jwt_in_request
from src.auth.rbac import Role

# Import all middleware modules
from src.api.middlewares.request_logger import log_request, apply_request_logger
from src.api.middlewares.error_handler import APIError, register_error_handlers
from src.api.middlewares.api_usage_logger import log_api_usage, apply_api_usage_logger
from src.api.middlewares.rate_limiter import rate_limit, apply_global_rate_limit
from src.api.middlewares.validation_middleware import validate_json, validate_schema, validate_params

def admin_required():
    """Middleware to ensure the user has admin role"""
    def wrapper(fn):
        @wraps(fn)
        def decorator(*args, **kwargs):
            verify_jwt_in_request()
            claims = get_jwt()
            if claims["role"] != Role.ADMIN.value:
                return jsonify({'message': 'Admin access required'}), 403
            return fn(*args, **kwargs)
        return decorator
    return wrapper

def role_required(allowed_roles):
    """Middleware to ensure the user has one of the allowed roles"""
    def wrapper(fn):
        @wraps(fn)
        def decorator(*args, **kwargs):
            verify_jwt_in_request()
            claims = get_jwt()
            if claims["role"] not in [role.value for role in allowed_roles]:
                return jsonify({'message': 'Insufficient permissions'}), 403
            return fn(*args, **kwargs)
        return decorator
    return wrapper

def setup_middlewares(app):
    """Initialize and register all middlewares with the Flask app"""
    # Register error handlers
    register_error_handlers(app)
    
    # Apply request logging
    apply_request_logger(app)
    
    # Apply API usage tracking
    apply_api_usage_logger(app)
    
    # Apply global rate limiting
    apply_global_rate_limit(app, requests_per_window=300, window_seconds=60)
