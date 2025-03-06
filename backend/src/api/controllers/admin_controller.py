# Admin controller - business logic for admin-only operations

from flask import jsonify, request
from ...db.models import db, User, Project, Task  # Changed to relative import
from ..validators.admin_validator import validate_system_settings  # Changed to relative import

def get_system_stats():
    """Controller function to get system statistics for admin dashboard"""
    # Count users by role
    users = User.query.all()
    user_stats = {
        'total': len(users),
        'admins': len([u for u in users if u.role == 'admin']),
        'team_leads': len([u for u in users if u.role == 'team_lead']),
        'developers': len([u for u in users if u.role == 'developer'])
    }
    
    # Count projects by status
    projects = Project.query.all()
    project_stats = {
        'total': len(projects),
        'active': len([p for p in projects if p.status == 'active']),
        'completed': len([p for p in projects if p.status == 'completed']),
        'on_hold': len([p for p in projects if p.status == 'on_hold'])
    }
    
    # Count tasks by status
    tasks = Task.query.all()
    task_stats = {
        'total': len(tasks),
        'todo': len([t for t in tasks if t.status == 'todo']),
        'in_progress': len([t for t in tasks if t.status == 'in_progress']),
        'review': len([t for t in tasks if t.status == 'review']),
        'done': len([t for t in tasks if t.status == 'done'])
    }
    
    return jsonify({
        'users': user_stats,
        'projects': project_stats,
        'tasks': task_stats
    })

def get_system_settings():
    """Controller function to get system settings"""
    # This would typically retrieve settings from a database
    # For now, return placeholder settings
    settings = {
        'app_name': 'DevSync',
        'allow_registration': True,
        'default_user_role': 'developer',
        'github_integration_enabled': True,
        'notification_settings': {
            'email_notifications': True,
            'task_assignments': True,
            'project_updates': True
        }
    }
    
    return jsonify({'settings': settings})

def update_system_settings():
    """Controller function to update system settings"""
    data = request.get_json()
    
    # Validate settings data
    validation_result = validate_system_settings(data)
    if validation_result:
        return validation_result
    
    # This would typically update settings in a database
    # For now, just return success response
    
    return jsonify({
        'message': 'System settings updated successfully',
        'settings': data
    })
