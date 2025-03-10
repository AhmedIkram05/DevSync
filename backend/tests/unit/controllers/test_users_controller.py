import sys
import os
import pytest
from unittest.mock import patch, MagicMock
from flask import Flask, jsonify

# Set up proper import paths
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../../../..')))

@pytest.fixture
def app():
    app = Flask(__name__)
    app.config['TESTING'] = True
    app.config['SECRET_KEY'] = 'test-secret-key'
    app.config['JWT_SECRET_KEY'] = 'test-secret-key'
    app.config['JWT_TOKEN_LOCATION'] = ['headers']
    
    yield app

@pytest.fixture
def client(app):
    return app.test_client()

@pytest.fixture
def mock_jwt_identity():
    with patch('backend.src.api.controllers.users_controller.get_jwt_identity') as mock:
        mock.return_value = {'user_id': 1}
        yield mock

@pytest.fixture
def mock_db():
    with patch('backend.src.api.controllers.users_controller.db') as mock:
        yield mock

@pytest.fixture
def mock_user():
    user = MagicMock()
    user.id = 1
    user.name = "Test User"
    user.email = "test@example.com"
    user.role = "developer"
    user.github_username = "testuser"
    user.avatar = "avatar_url"
    user.created_at = MagicMock()
    user.created_at.isoformat.return_value = "2023-01-01T00:00:00"
    return user

def test_get_all_users(app, mock_db, mock_user):
    with app.test_request_context():
        with patch('backend.src.api.controllers.users_controller.User.query') as mock_query:
            # Configure the mock query
            mock_query.all.return_value = [mock_user]
            
            # Import the function locally to use patched modules
            from backend.src.api.controllers.users_controller import get_all_users
            
            # Call the function
            response = get_all_users()
            
            # Assert the results
            data = response.get_json()
            assert 'users' in data
            assert len(data['users']) == 1
            assert data['users'][0]['name'] == "Test User"
            assert data['users'][0]['email'] == "test@example.com"

def test_get_user_by_id(app, mock_db, mock_user):
    with app.test_request_context():
        with patch('backend.src.api.controllers.users_controller.User.query') as mock_query:
            # Configure the mock query
            mock_query.get_or_404.return_value = mock_user
            
            # Import the function locally to use patched modules
            from backend.src.api.controllers.users_controller import get_user_by_id
            
            # Call the function
            response = get_user_by_id(1)
            
            # Assert the results
            data = response.get_json()
            assert 'user' in data
            assert data['user']['id'] == 1
            assert data['user']['name'] == "Test User"
            assert data['user']['email'] == "test@example.com"

def test_update_user_success(app, mock_db, mock_user):
    with app.test_request_context(json={'name': 'Updated Name', 'email': 'new@example.com'}):
        with patch('backend.src.api.controllers.users_controller.User.query') as mock_query:
            # Configure the mock query
            mock_query.get_or_404.return_value = mock_user
            mock_query.filter_by.return_value.first.return_value = None  # No existing user with same email
            
            # Import the function locally to use patched modules
            from backend.src.api.controllers.users_controller import update_user
            
            # Call the function
            response = update_user(1)
            
            # Assert the results
            data = response.get_json()
            assert 'message' in data
            assert 'User updated successfully' in data['message']
            assert mock_user.name == 'Updated Name'
            assert mock_user.email == 'new@example.com'
            assert mock_db.session.commit.called

def test_update_user_email_exists(app, mock_db, mock_user):
    with app.test_request_context(json={'email': 'existing@example.com'}):
        with patch('backend.src.api.controllers.users_controller.User.query') as mock_query:
            # Configure the mock query - email already taken
            mock_query.get_or_404.return_value = mock_user
            existing_user = MagicMock()
            existing_user.id = 2  # Different user
            mock_query.filter_by.return_value.first.return_value = existing_user
            
            # Import the function locally to use patched modules
            from backend.src.api.controllers.users_controller import update_user
            
            # Call the function
            response, status = update_user(1)
            
            # Assert the results
            data = response.get_json()
            assert 'message' in data
            assert 'Email already in use' in data['message']
            assert status == 409

def test_delete_user(app, mock_db, mock_user):
    with app.test_request_context():
        with patch('backend.src.api.controllers.users_controller.User.query') as mock_query:
            # Configure the mock query
            mock_query.get_or_404.return_value = mock_user
            
            # Import the function locally to use patched modules
            from backend.src.api.controllers.users_controller import delete_user
            
            # Call the function
            response = delete_user(1)
            
            # Assert the results
            data = response.get_json()
            assert 'message' in data
            assert 'User deleted successfully' in data['message']
            assert mock_db.session.delete.called
            assert mock_db.session.commit.called

def test_get_current_user_profile(app, mock_jwt_identity, mock_db, mock_user):
    with app.test_request_context():
        with patch('backend.src.api.controllers.users_controller.User.query') as mock_query:
            # Configure the mock query
            mock_query.get_or_404.return_value = mock_user
            
            # Import the function locally to use patched modules
            from backend.src.api.controllers.users_controller import get_current_user_profile
            
            # Call the function
            response = get_current_user_profile()
            
            # Assert the results
            data = response.get_json()
            assert 'user' in data
            assert data['user']['id'] == 1
            assert data['user']['name'] == "Test User"
            assert data['user']['email'] == "test@example.com"

def test_update_current_user_profile_success(app, mock_jwt_identity, mock_db, mock_user):
    with app.test_request_context(json={'name': 'Updated Profile'}):
        with patch('backend.src.api.controllers.users_controller.User.query') as mock_query:
            # Configure the mock query
            mock_query.get_or_404.return_value = mock_user
            mock_query.filter_by.return_value.first.return_value = None  # No existing user with same email
            
            # Import the function locally to use patched modules
            from backend.src.api.controllers.users_controller import update_current_user_profile
            
            # Call the function
            response = update_current_user_profile()
            
            # Assert the results
            data = response.get_json()
            assert 'message' in data
            assert 'Profile updated successfully' in data['message']
            assert mock_user.name == 'Updated Profile'
            assert mock_db.session.commit.called

def test_update_current_user_password(app, mock_jwt_identity, mock_db, mock_user):
    with app.test_request_context(json={
        'current_password': 'password123', 
        'new_password': 'newpassword123'
    }):
        with patch('backend.src.api.controllers.users_controller.User.query') as mock_query, \
             patch('backend.src.api.controllers.users_controller.verify_password') as mock_verify, \
             patch('backend.src.api.controllers.users_controller.hash_password') as mock_hash:
            
            # Configure the mocks
            mock_query.get_or_404.return_value = mock_user
            mock_verify.return_value = True  # Current password is correct
            mock_hash.return_value = 'hashed_new_password'
            
            # Import the function locally to use patched modules
            from backend.src.api.controllers.users_controller import update_current_user_profile
            
            # Call the function
            response = update_current_user_profile()
            
            # Assert the results
            data = response.get_json()
            assert 'message' in data
            assert 'Profile updated successfully' in data['message']
            assert mock_user.password == 'hashed_new_password'
            assert mock_verify.called
            assert mock_hash.called
            assert mock_db.session.commit.called

def test_update_current_user_wrong_password(app, mock_jwt_identity, mock_db, mock_user):
    with app.test_request_context(json={
        'current_password': 'wrongpassword', 
        'new_password': 'newpassword123'
    }):
        with patch('backend.src.api.controllers.users_controller.User.query') as mock_query, \
             patch('backend.src.api.controllers.users_controller.verify_password') as mock_verify:
            
            # Configure the mocks
            mock_query.get_or_404.return_value = mock_user
            mock_verify.return_value = False  # Current password is incorrect
            
            # Import the function locally to use patched modules
            from backend.src.api.controllers.users_controller import update_current_user_profile
            
            # Call the function
            response, status = update_current_user_profile()
            
            # Assert the results
            data = response.get_json()
            assert 'message' in data
            assert 'Current password is incorrect' in data['message']
            assert status == 400
            assert mock_verify.called