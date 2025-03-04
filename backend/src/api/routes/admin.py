# Admin-specific routes with RBAC protection

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from src.db.models import db, User
from src.auth.rbac import require_permission, require_role, Role

admin_bp = Blueprint('admin', __name__)

@admin_bp.route('/users', methods=['GET'])
@jwt_required()
@require_permission('can_manage_users')
def get_users():
    """Get all users (admin only)"""
    users = User.query.all()
    
    users_data = [{
        'id': user.id,
        'name': user.name,
        'email': user.email,
        'role': user.role,
        'created_at': user.created_at.isoformat()
    } for user in users]
    
    return jsonify({'users': users_data})

@admin_bp.route('/users/<int:user_id>', methods=['PUT'])
@jwt_required()
@require_permission('can_manage_users')
def update_user(user_id):
    """Update user details including role (admin only)"""
    data = request.get_json()
    user = User.query.get_or_404(user_id)
    
    if 'name' in data:
        user.name = data['name']
    
    if 'role' in data:
        # Ensure role is valid
        if data['role'] not in [r.value for r in Role]:
            return jsonify({'message': 'Invalid role'}), 400
        user.role = data['role']
    
    db.session.commit()
    
    return jsonify({
        'message': 'User updated successfully',
        'user': {
            'id': user.id,
            'name': user.name,
            'email': user.email,
            'role': user.role
        }
    })

@admin_bp.route('/users/<int:user_id>', methods=['DELETE'])
@jwt_required()
@require_permission('can_manage_users')
def delete_user(user_id):
    """Delete a user (admin only)"""
    user = User.query.get_or_404(user_id)
    
    # Prevent deleting yourself
    current_user_id = get_jwt_identity()['user_id']
    if user_id == current_user_id:
        return jsonify({'message': 'Cannot delete yourself'}), 403
    
    db.session.delete(user)
    db.session.commit()
    
    return jsonify({'message': 'User deleted successfully'})

@admin_bp.route('/system/settings', methods=['GET'])
@jwt_required()
@require_permission('can_manage_system_settings')
def get_system_settings():
    """Get system settings (admin only)"""
    # This would typically fetch from a settings table or configuration
    settings = {
        'maintenance_mode': False,
        'allow_user_registration': True,
        'github_integration_enabled': True,
        'notification_email_enabled': True
    }
    
    return jsonify({'settings': settings})

@admin_bp.route('/system/settings', methods=['PUT'])
@jwt_required()
@require_permission('can_manage_system_settings')
def update_system_settings():
    """Update system settings (admin only)"""
    data = request.get_json()
    
    # This would typically update a settings table or configuration
    # For now, just return the data that would be updated
    
    return jsonify({
        'message': 'Settings updated successfully',
        'settings': data
    })
