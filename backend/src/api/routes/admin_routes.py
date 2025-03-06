"""Admin API routes"""

from flask import request
from flask_jwt_extended import jwt_required
from ..controllers.admin_controller import (
    get_system_stats,
    get_system_settings,
    update_system_settings
)
from ..middlewares import admin_required
from ..middlewares.validation_middleware import validate_json
from ..middlewares.rate_limiter import rate_limit

def register_routes(bp):
    """Register all admin routes with the provided Blueprint"""
    
    @bp.route('/admin/stats', methods=['GET'])
    @jwt_required()
    @admin_required()
    @rate_limit(requests_per_window=20, window_seconds=60)
    def system_stats():
        """Route to get system statistics"""
        return get_system_stats()
    
    @bp.route('/admin/settings', methods=['GET'])
    @jwt_required()
    @admin_required()
    @rate_limit(requests_per_window=20, window_seconds=60)
    def system_settings():
        """Route to get system settings"""
        return get_system_settings()
    
    @bp.route('/admin/settings', methods=['PUT'])
    @jwt_required()
    @admin_required()
    @validate_json()
    @rate_limit(requests_per_window=10, window_seconds=60)
    def update_settings():
        """Route to update system settings"""
        return update_system_settings()
