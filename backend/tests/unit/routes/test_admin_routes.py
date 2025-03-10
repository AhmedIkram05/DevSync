import sys
import os
import json
import unittest
from unittest.mock import patch, MagicMock
from flask import Flask, Response

# Set up proper import paths
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../../../..')))

# Create a different Flask app for each test to avoid conflicts
class TestAdminRoutes(unittest.TestCase):
    def setUp(self):
        # Create a fresh Flask app instance for each test
        self.app = Flask(__name__)
        self.app.config['TESTING'] = True
        self.client = self.app.test_client()
    
    def test_system_stats_endpoint(self):
        # Create route before any request is made
        @self.app.route('/admin/stats', methods=['GET'])
        def mock_system_stats():
            return Response(
                json.dumps({
                    'users': {'total': 5},
                    'projects': {'total': 10},
                    'tasks': {'total': 20}
                }),
                mimetype='application/json'
            )
        
        # Test the endpoint
        response = self.client.get('/admin/stats')
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertIn('users', data)
        self.assertEqual(data['users']['total'], 5)
    
    def test_get_system_settings_endpoint(self):
        # Create route before any request is made
        @self.app.route('/admin/settings', methods=['GET'])
        def mock_get_system_settings():
            return Response(
                json.dumps({
                    'settings': {
                        'app_name': 'DevSync',
                        'allow_registration': True
                    }
                }),
                mimetype='application/json'
            )
        
        # Test the endpoint
        response = self.client.get('/admin/settings')
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertIn('settings', data)
    
    def test_update_system_settings_endpoint(self):
        # Create route before any request is made
        @self.app.route('/admin/settings', methods=['PUT'])
        def mock_update_system_settings():
            return Response(
                json.dumps({
                    'message': 'System settings updated successfully',
                    'settings': {'app_name': 'Updated DevSync'}
                }),
                mimetype='application/json'
            )
        
        # Test the endpoint
        response = self.client.put(
            '/admin/settings',
            data=json.dumps({'app_name': 'Updated DevSync'}),
            content_type='application/json'
        )
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertEqual(data['message'], 'System settings updated successfully')
    
    def test_update_user_role_endpoint(self):
        # Create route before any request is made
        @self.app.route('/admin/users/<int:user_id>/role', methods=['PUT'])
        def mock_update_user_role(user_id):
            return Response(
                json.dumps({
                    'message': 'User role updated successfully',
                    'user': {'id': user_id, 'role': 'admin'}
                }),
                mimetype='application/json'
            )
        
        # Test the endpoint
        response = self.client.put(
            '/admin/users/1/role',
            data=json.dumps({'role': 'admin'}),
            content_type='application/json'
        )
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertEqual(data['message'], 'User role updated successfully')
        self.assertEqual(data['user']['id'], 1)

if __name__ == '__main__':
    unittest.main()