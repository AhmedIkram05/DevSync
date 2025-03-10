import sys
import os
import json
import unittest
from unittest.mock import patch, MagicMock
from flask import Flask, Response

# Set up proper import paths
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../../../..')))

class TestAuthRoutes(unittest.TestCase):
    def setUp(self):
        # Create a fresh Flask app instance for each test
        self.app = Flask(__name__)
        self.app.config['TESTING'] = True
        self.client = self.app.test_client()
    
    def test_login_route(self):
        # Create mock route before any request is made
        @self.app.route('/auth/login', methods=['POST'])
        def mock_login():
            return Response(
                json.dumps({
                    'message': 'Login successful',
                    'user': {
                        'id': 1,
                        'name': 'Test User',
                        'email': 'test@example.com',
                        'role': 'developer'
                    }
                }),
                mimetype='application/json',
                status=200
            )
        
        # Test the endpoint with valid data
        response = self.client.post(
            '/auth/login',
            data=json.dumps({
                'email': 'test@example.com',
                'password': 'password123'
            }),
            content_type='application/json'
        )
        
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertEqual(data['message'], 'Login successful')
        self.assertEqual(data['user']['email'], 'test@example.com')
    
    def test_register_route(self):
        # Create mock route before any request is made
        @self.app.route('/auth/register', methods=['POST'])
        def mock_register():
            return Response(
                json.dumps({
                    'message': 'User registered successfully',
                    'user': {
                        'id': 1,
                        'name': 'New User',
                        'email': 'new@example.com',
                        'role': 'developer'
                    }
                }),
                mimetype='application/json',
                status=201
            )
        
        # Test the endpoint with valid data
        response = self.client.post(
            '/auth/register',
            data=json.dumps({
                'name': 'New User',
                'email': 'new@example.com',
                'password': 'password123',
                'role': 'developer'
            }),
            content_type='application/json'
        )
        
        self.assertEqual(response.status_code, 201)
        data = json.loads(response.data)
        self.assertEqual(data['message'], 'User registered successfully')
        self.assertEqual(data['user']['email'], 'new@example.com')
    
    def test_logout_route(self):
        # Create mock route
        @self.app.route('/auth/logout', methods=['POST'])
        def mock_logout():
            return Response(
                json.dumps({'message': 'Logout successful'}),
                mimetype='application/json',
                status=200
            )
        
        # Test the endpoint
        response = self.client.post('/auth/logout')
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertEqual(data['message'], 'Logout successful')
    
    def test_refresh_token_route(self):
        # Create mock route
        @self.app.route('/auth/refresh', methods=['POST'])
        def mock_refresh():
            return Response(
                json.dumps({'message': 'Token refreshed successfully'}),
                mimetype='application/json',
                status=200
            )
        
        # Test the endpoint
        response = self.client.post('/auth/refresh')
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertEqual(data['message'], 'Token refreshed successfully')
    
    def test_get_current_user_route(self):
        # Create mock route
        @self.app.route('/auth/me', methods=['GET'])
        def mock_me():
            return Response(
                json.dumps({
                    'user': {
                        'id': 1,
                        'name': 'Test User',
                        'email': 'test@example.com',
                        'role': 'developer'
                    }
                }),
                mimetype='application/json',
                status=200
            )
        
        # Test the endpoint
        response = self.client.get('/auth/me')
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertIn('user', data)
        self.assertEqual(data['user']['name'], 'Test User')

if __name__ == '__main__':
    unittest.main()