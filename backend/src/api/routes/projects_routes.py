"""Project management API routes"""

from flask import request
from flask_jwt_extended import jwt_required
from src.api.controllers.projects_controller import (
    get_all_projects, get_project_by_id, create_project,
    update_project, delete_project, get_project_tasks
)
from src.api.middlewares.validation_middleware import validate_json, validate_params
from src.api.middlewares import role_required
from src.api.middlewares.api_usage_logger import log_api_usage
from src.api.middlewares.request_logger import log_request
from src.auth.rbac import Role

def register_routes(bp):
    """Register all project routes with the provided Blueprint"""
    
    @bp.route('/projects', methods=['GET'])
    @jwt_required()
    @log_api_usage()
    @log_request()
    def projects_list():
        """Route to get all projects visible to user"""
        return get_all_projects()
    
    @bp.route('/projects', methods=['POST'])
    @jwt_required()
    @role_required([Role.ADMIN, Role.TEAM_LEAD])
    @validate_json()
    @log_api_usage()
    @log_request()
    def create_project_route():
        """Route to create a new project"""
        return create_project()
    
    @bp.route('/projects/<int:project_id>', methods=['GET'])
    @jwt_required()
    @log_api_usage()
    def get_project(project_id):
        """Route to get a specific project"""
        return get_project_by_id(project_id)
    
    @bp.route('/projects/<int:project_id>', methods=['PUT'])
    @jwt_required()
    @role_required([Role.ADMIN, Role.TEAM_LEAD])
    @validate_json()
    @log_api_usage()
    def update_project_route(project_id):
        """Route to update a project"""
        return update_project(project_id)
    
    @bp.route('/projects/<int:project_id>', methods=['DELETE'])
    @jwt_required()
    @role_required([Role.ADMIN, Role.TEAM_LEAD])
    @log_api_usage()
    def delete_project_route(project_id):
        """Route to delete a project"""
        return delete_project(project_id)
    
    @bp.route('/projects/<int:project_id>/tasks', methods=['GET'])
    @jwt_required()
    @log_api_usage()
    def project_tasks(project_id):
        """Route to get all tasks for a project"""
        return get_project_tasks(project_id)
