# Task controller - business logic

from flask import request, jsonify
from flask_jwt_extended import get_jwt_identity, get_jwt
from ...db.models import db, Task, User  # Changed to relative import
from ...auth.rbac import Role  # Changed to relative import
from ..validators.task_validator import validate_task_data  # Changed to relative import

def get_all_tasks():
    """Controller function to get all tasks based on user role and filters"""
    user_id = get_jwt_identity()['user_id']
    claims = get_jwt()
    user_role = claims.get('role')
    
    # Get query parameters for filtering
    status = request.args.get('status')
    assigned_to = request.args.get('assigned_to')
    created_by = request.args.get('created_by')
    
    # Start with base query
    query = Task.query
    
    # Apply filters if provided
    if status:
        query = query.filter(Task.status == status)
    if assigned_to:
        query = query.filter(Task.assigned_to == assigned_to)
    if created_by:
        query = query.filter(Task.created_by == created_by)
    
    # Apply role-based filtering
    if user_role == Role.ADMIN.value:
        # Admins (Project Managers) can see all tasks
        tasks = query.all()
    else:
        # Clients (Team Members) can only see tasks assigned to them or created by them
        tasks = query.filter(
            (Task.assigned_to == user_id) | (Task.created_by == user_id)
        ).all()
    
    # Convert tasks to JSON response
    tasks_data = [{
        'id': task.id,
        'title': task.title,
        'description': task.description,
        'status': task.status,
        'progress': task.progress,
        'assigned_to': task.assigned_to,
        'created_by': task.created_by,
        'deadline': task.deadline.isoformat() if task.deadline else None,
        'created_at': task.created_at.isoformat() if task.created_at else None,
        'updated_at': task.updated_at.isoformat() if task.updated_at else None
    } for task in tasks]
    
    return jsonify({'tasks': tasks_data})

def get_task_by_id(task_id):
    """Controller function to get a single task"""
    user_id = get_jwt_identity()['user_id']
    claims = get_jwt()
    user_role = claims.get('role')
    
    task = Task.query.get_or_404(task_id)
    
    # Apply role-based access control
    if (user_role == Role.CLIENT.value and 
        task.assigned_to != user_id and task.created_by != user_id):
        return jsonify({'message': 'You do not have permission to view this task'}), 403
    
    # Format task data
    task_data = {
        'id': task.id,
        'title': task.title,
        'description': task.description,
        'status': task.status,
        'progress': task.progress,
        'assigned_to': task.assigned_to,
        'created_by': task.created_by,
        'deadline': task.deadline.isoformat() if task.deadline else None,
        'created_at': task.created_at.isoformat() if task.created_at else None,
        'updated_at': task.updated_at.isoformat() if task.updated_at else None
    }
    
    # Get user details for assigned_to and created_by
    if task.assigned_to:
        assignee = User.query.get(task.assigned_to)
        if assignee:
            task_data['assignee_name'] = assignee.name
    
    creator = User.query.get(task.created_by)
    if creator:
        task_data['creator_name'] = creator.name
    
    return jsonify({'task': task_data})

def create_new_task():
    """Controller function to create a new task"""
    data = request.get_json()
    
    # Validate task data
    validation_result = validate_task_data(data)
    if validation_result:
        return validation_result
    
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

def update_task_by_id(task_id):
    """Controller function to update a task"""
    data = request.get_json()
    user_id = get_jwt_identity()['user_id']
    claims = get_jwt()
    user_role = claims.get('role')
    
    task = Task.query.get_or_404(task_id)
    
    # Check if user has permission to update this task
    if user_role == Role.CLIENT.value and task.assigned_to != user_id:
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
    
    # Only admins (Project Managers) can reassign tasks
    if 'assigned_to' in data and user_role == Role.ADMIN.value:
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

def delete_task_by_id(task_id):
    """Controller function to delete a task"""
    task = Task.query.get_or_404(task_id)
    
    db.session.delete(task)
    db.session.commit()
    
    return jsonify({'message': 'Task deleted successfully'})
