# Dashboard controller - business logic for user dashboards

from flask import jsonify
from flask_jwt_extended import get_jwt_identity, get_jwt
from src.db.models import db, User, Task, Project
from src.auth.rbac import Role
from datetime import datetime, timedelta

def get_user_dashboard():
    """Controller function to get dashboard data for the current user"""
    user_id = get_jwt_identity()['user_id']
    claims = get_jwt()
    user_role = claims.get('role')
    
    # Get basic user info
    user = User.query.get_or_404(user_id)
    
    # Get assigned tasks
    assigned_tasks = Task.query.filter_by(assigned_to=user_id).all()
    
    # Get tasks due soon (within 7 days)
    today = datetime.now().date()
    week_later = today + timedelta(days=7)
    tasks_due_soon = Task.query.filter_by(assigned_to=user_id)\
        .filter(Task.deadline >= today, Task.deadline <= week_later)\
        .filter(Task.status != 'done').all()
    
    # Get recently completed tasks (last 30 days)
    month_ago = today - timedelta(days=30)
    completed_tasks = Task.query.filter_by(assigned_to=user_id, status='done')\
        .filter(Task.updated_at >= month_ago).all()
    
    # Get projects user is part of
    user_projects = user.projects.all()  # Assuming a many-to-many relationship exists
    
    # Format response data
    dashboard_data = {
        'user': {
            'id': user.id,
            'name': user.name,
            'role': user.role
        },
        'tasks': {
            'assigned_count': len(assigned_tasks),
            'pending_count': len([t for t in assigned_tasks if t.status != 'done']),
            'completed_count': len([t for t in assigned_tasks if t.status == 'done']),
            'due_soon': [{
                'id': task.id,
                'title': task.title,
                'deadline': task.deadline.isoformat() if task.deadline else None,
                'status': task.status,
                'project_id': task.project_id
            } for task in tasks_due_soon],
            'recently_completed': [{
                'id': task.id,
                'title': task.title,
                'completed_date': task.updated_at.isoformat() if task.updated_at else None,
                'project_id': task.project_id
            } for task in completed_tasks[:5]]  # Limit to 5 most recent
        },
        'projects': [{
            'id': project.id,
            'name': project.name,
            'status': project.status
        } for project in user_projects]
    }
    
    # Add team lead or admin specific data
    if user_role in [Role.ADMIN.value, Role.TEAM_LEAD.value]:
        # Get team stats if they're a lead
        team_tasks = Task.query.join(Project, Task.project_id == Project.id)\
            .filter(Project.created_by == user_id).all()
        
        dashboard_data['team'] = {
            'total_tasks': len(team_tasks),
            'completed_tasks': len([t for t in team_tasks if t.status == 'done']),
            'in_progress_tasks': len([t for t in team_tasks if t.status == 'in_progress']),
            'pending_tasks': len([t for t in team_tasks if t.status == 'todo'])
        }
    
    return jsonify(dashboard_data)

def get_project_dashboard(project_id):
    """Controller function to get dashboard data for a specific project"""
    # Check if project exists
    project = Project.query.get_or_404(project_id)
    
    # Get all tasks for this project
    tasks = Task.query.filter_by(project_id=project_id).all()
    
    # Calculate task statistics
    task_stats = {
        'total': len(tasks),
        'todo': len([t for t in tasks if t.status == 'todo']),
        'in_progress': len([t for t in tasks if t.status == 'in_progress']),
        'review': len([t for t in tasks if t.status == 'review']),
        'done': len([t for t in tasks if t.status == 'done'])
    }
    
    # Calculate completion percentage
    completion_percentage = 0
    if task_stats['total'] > 0:
        completion_percentage = (task_stats['done'] / task_stats['total']) * 100
    
    # Get tasks due soon (within 7 days)
    today = datetime.now().date()
    week_later = today + timedelta(days=7)
    tasks_due_soon = Task.query.filter_by(project_id=project_id)\
        .filter(Task.deadline >= today, Task.deadline <= week_later)\
        .filter(Task.status != 'done').all()
    
    # Get recently updated tasks
    recently_updated = Task.query.filter_by(project_id=project_id)\
        .order_by(Task.updated_at.desc()).limit(5).all()
    
    # Get team members
    team_members = project.team_members.all()
    
    dashboard_data = {
        'project': {
            'id': project.id,
            'name': project.name,
            'description': project.description,
            'status': project.status,
            'completion_percentage': completion_percentage
        },
        'task_stats': task_stats,
        'tasks_due_soon': [{
            'id': task.id,
            'title': task.title,
            'deadline': task.deadline.isoformat() if task.deadline else None,
            'status': task.status,
            'assigned_to': task.assigned_to
        } for task in tasks_due_soon],
        'recently_updated_tasks': [{
            'id': task.id,
            'title': task.title,
            'status': task.status,
            'updated_at': task.updated_at.isoformat() if task.updated_at else None
        } for task in recently_updated],
        'team_members': [{
            'id': member.id,
            'name': member.name,
            'role': member.role
        } for member in team_members]
    }
    
    return jsonify(dashboard_data)
