# Task management routes with RBAC applied

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from src.db.models import db, Task, User
from src.auth.rbac import require_permission, require_role, Role

tasks_bp = Blueprint('tasks', __name__)

@tasks_bp.route('/', methods=['GET'])
@jwt_required()
@require_permission('can_view_tasks')
def get_tasks():
    """Get all tasks (filtered by role permissions)"""
    user_id = get_jwt_identity()['user_id']
    claims = get_jwt()
    user_role = claims.get('role')
    
    # Apply role-based filtering
    if user_role == Role.ADMIN.value:
        # Admins can see all tasks
        tasks = Task.query.all()
    elif user_role == Role.TEAM_LEAD.value:
        # Team leads can see all tasks in their team
        tasks = Task.query.all()  # Simplified - would normally filter by team
    else:
        # Developers can only see tasks assigned to them or created by them
        tasks = Task.query.filter(
            (Task.assigned_to == user_id) | (Task.created_by == user_id)
        ).all()
    
    # Convert tasks to JSON response
    tasks_data = [{
        'id': task.id,
        'title': task.title,
        'status': task.status,
        'progress': task.progress,
        'deadline': task.deadline.isoformat() if task.deadline else None,
        'assigned_to': task.assigned_to
    } for task in tasks]
    
    return jsonify({'tasks': tasks_data})

@tasks_bp.route('/', methods=['POST'])
@jwt_required()
@require_permission('can_create_tasks')
def create_task():
    """Create a new task (requires team_lead or admin role)"""
    data = request.get_json()
    
    # Validate required fields
    if not all(k in data for k in ['title', 'description', 'status']):
        return jsonify({'message': 'Missing required fields'}), 400
    
    user_id = get_jwt_identity()['user_id']
    
    # Create new task
    new_task = Task(
        title=data['title'],
        description=data['description'],
        status=data['status'],
        progress=data.get('progress', 0),
        assigned_to=data.get('assigned_to'),
        created_by=user_id,
        deadline=data.get('deadline')
    )
    
    db.session.add(new_task)
    db.session.commit()
    
    return jsonify({
        'message': 'Task created successfully',
        'task': {
            'id': new_task.id,
            'title': new_task.title,
            'status': new_task.status
        }
    }), 201

@tasks_bp.route('/<int:task_id>', methods=['PUT'])
@jwt_required()
@require_permission('can_update_assigned_tasks')
def update_task(task_id):
    """Update an existing task"""
    data = request.get_json()
    user_id = get_jwt_identity()['user_id']
    claims = get_jwt()
    user_role = claims.get('role')
    
    task = Task.query.get_or_404(task_id)
    
    # Check if user has permission to update this task
    if user_role == Role.DEVELOPER.value and task.assigned_to != user_id:
        return jsonify({'message': 'You can only update tasks assigned to you'}), 403
    
    # Update allowed fields
    if 'title' in data:
        task.title = data['title']
    if 'description' in data:
        task.description = data['description']
    if 'status' in data:
        task.status = data['status']
    if 'progress' in data:
        task.progress = data['progress']
    
    # Only team leads and admins can reassign tasks
    if 'assigned_to' in data and user_role in [Role.TEAM_LEAD.value, Role.ADMIN.value]:
        task.assigned_to = data['assigned_to']
    
    db.session.commit()
    
    return jsonify({
        'message': 'Task updated successfully',
        'task': {
            'id': task.id,
            'title': task.title,
            'status': task.status,
            'progress': task.progress
        }
    })

@tasks_bp.route('/<int:task_id>', methods=['DELETE'])
@jwt_required()
@require_permission('can_delete_tasks')
def delete_task(task_id):
    """Delete a task (admin only)"""
    task = Task.query.get_or_404(task_id)
    
    db.session.delete(task)
    db.session.commit()
    
    return jsonify({'message': 'Task deleted successfully'})
