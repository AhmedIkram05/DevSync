import pytest
from unittest.mock import patch, MagicMock
from flask import Flask, Blueprint

@pytest.fixture
def app():
    app = Flask(__name__)
    app.config['TESTING'] = True
    app.config['SECRET_KEY'] = 'test-secret-key'
    app.config['JWT_TOKEN_LOCATION'] = ['headers']
    app.config['JWT_SECRET_KEY'] = 'jwt-secret-key'
    app.config['JWT_HEADER_NAME'] = 'Authorization'
    app.config["JWT_HEADER_TYPE"] = "Bearer"   # added to avoid KeyError
    
    from src.api.routes.notifications_routes import register_routes
    bp = Blueprint('api', __name__)
    register_routes(bp)
    app.register_blueprint(bp)
    with app.app_context():
        yield app

@pytest.fixture
def client(app):
    return app.test_client()

@pytest.fixture(autouse=True)
def mock_jwt_required():
    with patch('src.api.routes.notifications_routes.jwt_required', lambda: lambda f: f):
        yield

@pytest.fixture(autouse=True)
def bypass_jwt():
    from flask_jwt_extended.view_decorators import verify_jwt_in_request
    with patch.object(
        verify_jwt_in_request, '__call__', lambda *args, **kwargs: None
    ):
        yield

@pytest.fixture(autouse=True)
def bypass_jwt_verification():
    with patch('flask_jwt_extended.view_decorators.verify_jwt_in_request', lambda *args, **kwargs: None):
        yield

def test_get_notifications(client):
    with patch('src.api.routes.notifications_routes.get_user_notifications') as mock:
        mock.return_value = {'notifications': []}
        response = client.get('/notifications')
        assert response.status_code == 200
        mock.assert_called_once()

def test_create_notification(client):
    with patch('src.api.routes.notifications_routes.create_notification') as mock, \
         patch('src.api.routes.notifications_routes.validate_json', lambda: lambda f: f):
        mock.return_value = {'message': 'Created'}, 201
        response = client.post('/notifications', json={'content': 'Test notification', 'user_id': 1})
        assert response.status_code == 201
        mock.assert_called_once()

def test_mark_notification_read(client):
    with patch('src.api.routes.notifications_routes.mark_notification_read') as mock:
        mock.return_value = {'message': 'Marked as read'}
        response = client.put('/notifications/1/read')
        assert response.status_code == 200
        mock.assert_called_once_with(1)

def test_mark_all_notifications_read(client):
    with patch('src.api.routes.notifications_routes.mark_all_notifications_read') as mock:
        mock.return_value = {'message': 'All marked as read'}
        response = client.put('/notifications/read-all')
        assert response.status_code == 200
        mock.assert_called_once()

def test_delete_notification(client):
    with patch('src.api.routes.notifications_routes.delete_notification') as mock:
        mock.return_value = {'message': 'Deleted'}
        response = client.delete('/notifications/1')
        assert response.status_code == 200
        mock.assert_called_once_with(1)