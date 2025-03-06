"""Task comments API routes"""

from flask import request
from flask_jwt_extended import jwt_required
from src.api.controllers.comments_controller import (
    get_task_comments, add_comment,
    update_comment, delete_comment
)
from src.api.middlewares.validation_middleware import validate_json

def register_routes(bp):
    """Register all comment routes with the provided Blueprint"""
    
    @bp.route('/tasks/<int:task_id>/comments', methods=['GET'])
    @jwt_required()
    def comments_list(task_id):
        """Route to get all comments for a task"""
        return get_task_comments(task_id)
    
    @bp.route('/tasks/<int:task_id>/comments', methods=['POST'])
    @jwt_required()
    @validate_json
    def create_comment(task_id):
        """Route to add a comment to a task"""
        return add_comment(task_id)
    
    @bp.route('/comments/<int:comment_id>', methods=['PUT'])
    @jwt_required()
    @validate_json
    def update_comment_route(comment_id):
        """Route to update a comment"""
        return update_comment(comment_id)
    
    @bp.route('/comments/<int:comment_id>', methods=['DELETE'])
    @jwt_required()
    def delete_comment_route(comment_id):
        """Route to delete a comment"""
        return delete_comment(comment_id)
