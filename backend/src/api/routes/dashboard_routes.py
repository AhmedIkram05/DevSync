"""Dashboard API routes"""

from flask import request
from flask_jwt_extended import jwt_required
from ..controllers.dashboard_controller import (
    get_user_dashboard,
    get_project_dashboard
)
from ..middlewares import role_required
from ...auth.rbac import Role

def register_routes(bp):
    """Register all dashboard routes with the provided Blueprint"""
    
    @bp.route('/dashboard', methods=['GET'])
    @jwt_required()
    def user_dashboard():
        """Route to get dashboard data for current user"""
        return get_user_dashboard()
    
    @bp.route('/dashboard/projects/<int:project_id>', methods=['GET'])
    @jwt_required()
    def project_dashboard(project_id):
        """Route to get dashboard data for a specific project"""
        return get_project_dashboard(project_id)
