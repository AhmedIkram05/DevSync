# Role-Based Access Control implementation for DevSync

from enum import Enum
from functools import wraps
from flask import jsonify
from flask_jwt_extended import get_jwt, verify_jwt_in_request

# Define roles as an enum for better type checking and consistency
class Role(Enum):
    DEVELOPER = "developer"
    TEAM_LEAD = "team_lead"
    ADMIN = "admin"

# Define a hierarchy of roles and their allowed actions
ROLE_HIERARCHY = {
    Role.DEVELOPER.value: {
        "can_view_tasks", 
        "can_update_assigned_tasks",
        "can_comment",
        "can_view_notifications",
        "can_view_own_profile",
        "can_update_own_profile",
        "can_link_github"
    },
    Role.TEAM_LEAD.value: {
        "can_view_tasks", 
        "can_update_assigned_tasks",
        "can_comment",
        "can_view_notifications",
        "can_view_own_profile",
        "can_update_own_profile",
        "can_link_github",
        "can_create_tasks",
        "can_assign_tasks",
        "can_view_team_stats",
        "can_generate_reports",
        "can_view_all_profiles"
    },
    Role.ADMIN.value: {
        "can_view_tasks", 
        "can_update_assigned_tasks",
        "can_comment",
        "can_view_notifications",
        "can_view_own_profile",
        "can_update_own_profile",
        "can_link_github",
        "can_create_tasks",
        "can_assign_tasks",
        "can_view_team_stats",
        "can_generate_reports",
        "can_view_all_profiles",
        "can_delete_tasks",
        "can_manage_users",
        "can_manage_system_settings",
        "can_view_audit_logs"
    }
}

# Function to check if a role has a specific permission
def role_has_permission(role, required_permission):
    if role not in ROLE_HIERARCHY:
        return False
    return required_permission in ROLE_HIERARCHY[role]

# RBAC decorator to check permissions
def require_permission(required_permission):
    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            # Verify JWT is present and valid
            verify_jwt_in_request()
            
            # Get claims from the JWT
            claims = get_jwt()
            
            # Extract user role from claims
            if 'role' not in claims:
                return jsonify({"message": "Role information missing from token"}), 403
            
            user_role = claims['role']
            
            # Check if the role has the required permission
            if not role_has_permission(user_role, required_permission):
                return jsonify({"message": "Insufficient permissions"}), 403
            
            # If authorized, execute the function
            return fn(*args, **kwargs)
        return wrapper
    return decorator

# Decorator to require a specific role or higher
def require_role(min_role):
    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            # Verify JWT is present and valid
            verify_jwt_in_request()
            
            # Get claims from JWT
            claims = get_jwt()
            
            # Extract user role
            if 'role' not in claims:
                return jsonify({"message": "Role information missing from token"}), 403
            
            user_role = claims['role']
            
            # Define role hierarchy (higher index means higher privileges)
            role_levels = [Role.DEVELOPER.value, Role.TEAM_LEAD.value, Role.ADMIN.value]
            
            # Check if user's role level is sufficient
            if role_levels.index(user_role) < role_levels.index(min_role):
                return jsonify({"message": "Insufficient role level"}), 403
            
            # If authorized, execute the function
            return fn(*args, **kwargs)
        return wrapper
    return decorator
