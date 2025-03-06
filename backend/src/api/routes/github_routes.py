"""GitHub integration API routes"""

from flask import request
from flask_jwt_extended import jwt_required
from ..controllers.github_controller import (
    initiate_github_auth,
    github_callback,
    get_github_repositories,
    add_github_repository,
    get_repository_issues,
    get_repository_pulls,
    link_task_with_github,
    get_task_github_links,
    delete_task_github_link
)
from ..middlewares.validation_middleware import validate_json
from ..middlewares import role_required
from ...auth.rbac import Role

def register_routes(bp):
    """Register all GitHub integration routes with the provided Blueprint"""
    
    @bp.route('/github/auth', methods=['GET'])
    @jwt_required()
    def github_auth():
        """Route to initiate GitHub OAuth process"""
        return initiate_github_auth()
    
    @bp.route('/github/callback', methods=['GET'])
    def github_oauth_callback():
        """Route to handle GitHub OAuth callback"""
        return github_callback()
    
    @bp.route('/github/repositories', methods=['GET'])
    @jwt_required()
    def repositories_list():
        """Route to get GitHub repositories for the user"""
        return get_github_repositories()
    
    @bp.route('/github/repositories', methods=['POST'])
    @jwt_required()
    @validate_json()
    def add_repository():
        """Route to add a GitHub repository for tracking"""
        return add_github_repository()
    
    @bp.route('/github/repositories/<int:repo_id>/issues', methods=['GET'])
    @jwt_required()
    def repository_issues(repo_id):
        """Route to get issues for a repository"""
        return get_repository_issues(repo_id)
    
    @bp.route('/github/repositories/<int:repo_id>/pulls', methods=['GET'])
    @jwt_required()
    def repository_pulls(repo_id):
        """Route to get pull requests for a repository"""
        return get_repository_pulls(repo_id)
    
    @bp.route('/tasks/<int:task_id>/github', methods=['POST'])
    @jwt_required()
    @validate_json()
    def link_github(task_id):
        """Route to link a task with GitHub issue or PR"""
        return link_task_with_github(task_id)
    
    @bp.route('/tasks/<int:task_id>/github', methods=['GET'])
    @jwt_required()
    def get_github_links(task_id):
        """Route to get GitHub links for a task"""
        return get_task_github_links(task_id)
    
    @bp.route('/tasks/<int:task_id>/github/<int:link_id>', methods=['DELETE'])
    @jwt_required()
    def delete_github_link(task_id, link_id):
        """Route to delete a GitHub link from a task"""
        return delete_task_github_link(task_id, link_id)
