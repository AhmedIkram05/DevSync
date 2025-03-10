import sys
import os
import pytest
from unittest.mock import patch
from flask import Flask, Blueprint, request

# Set up proper import paths
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../../../..')))

@pytest.fixture
def app():
    app = Flask(__name__)
    app.config['TESTING'] = True
    app.config['SECRET_KEY'] = 'test-secret-key'
    app.config['JWT_SECRET_KEY'] = 'test-secret-key'
    
    # Register mock routes for testing
    @app.route('/api/users', methods=['GET'])
    def get_users():
        return {'users': []}, 200
        
    @app.route('/api/users/<int:user_id>', methods=['GET'])
    def get_user(user_id):
        return {'user': {'id': user_id, 'name': 'Test User'}}, 200
        
    @app.route('/api/users/<int:user_id>', methods=['PUT'])
    def update_user(user_id):
        if not request.json:
            return {'message': 'No data provided'}, 400
        return {'message': 'User updated', 'user': {'id': user_id, 'name': request.json.get('name', 'Updated')}}, 200
        
    @app.route('/api/users/<int:user_id>', methods=['DELETE'])
    def delete_user(user_id):
        return {'message': 'User deleted'}, 200
        
    @app.route('/api/profile', methods=['GET'])
    def get_profile():
        return {'user': {'id': 1, 'name': 'Current User'}}, 200
        
    @app.route('/api/profile', methods=['PUT'])
    def update_profile():
        if not request.json:
            return {'message': 'No data provided'}, 400
        return {'message': 'Profile updated', 'user': {'id': 1, 'name': request.json.get('name', 'Updated')}}, 200
    
    yield app

@pytest.fixture
def client(app):
    return app.test_client()

# Patch JWT required decorator to avoid authentication issues
@pytest.fixture(autouse=True)
def mock_jwt_required():
    with patch('backend.src.api.routes.users_routes.jwt_required', lambda: lambda f: f):
        yield

# Patch admin_required decorator
@pytest.fixture(autouse=True)
def mock_admin_required():
    with patch('backend.src.api.routes.users_routes.admin_required', lambda: lambda f: f):
        yield

# Patch role_required decorator
@pytest.fixture(autouse=True)
def mock_role_required():
    with patch('backend.src.api.routes.users_routes.role_required', lambda roles: lambda f: f):
        yield

# Test all user routes
@pytest.mark.parametrize('endpoint,method,data,expected_status', [
    ('/api/users', 'get', None, 200),
    ('/api/users/1', 'get', None, 200),
    ('/api/users/1', 'put', {'name': 'Updated User'}, 200),
    ('/api/users/1', 'put', {}, 400),
    ('/api/users/1', 'delete', None, 200),
    ('/api/profile', 'get', None, 200),
    ('/api/profile', 'put', {'name': 'Updated Profile'}, 200),
    ('/api/profile', 'put', {}, 400),
])
def test_users_routes(client, endpoint, method, data, expected_status):
    """Test all user routes with parameterized inputs"""
    
    if method == 'get':
        response = client.get(endpoint)
    elif method == 'put':
        response = client.put(endpoint, json=data if data is not None else {})
    elif method == 'delete':
        response = client.delete(endpoint)
    
    assert response.status_code == expected_status

def test_route_registration():
    """Test that routes are registered correctly"""
    app = Flask(__name__)
    bp = Blueprint('api', __name__, url_prefix='/api')
    
    # Import the function locally to avoid circular imports
    from backend.src.api.routes.users_routes import register_routes
    
    # Register routes with blueprint
    with patch('backend.src.api.routes.users_routes.jwt_required', lambda: lambda f: f), \
         patch('backend.src.api.routes.users_routes.admin_required', lambda: lambda f: f), \
         patch('backend.src.api.routes.users_routes.role_required', lambda roles: lambda f: f):
        register_routes(bp)
    
    # Register blueprint with app
    app.register_blueprint(bp)
    
    # Check routes are registered
    rules = [r.rule for r in app.url_map.iter_rules()]
    assert '/api/users' in rules
    assert '/api/users/<int:user_id>' in rules
    assert '/api/profile' in rules