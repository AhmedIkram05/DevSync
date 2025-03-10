import sys
import os
import unittest
from unittest.mock import patch, MagicMock, Mock
import json
from flask import Flask, Response

# Set up proper import paths
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../../../..')))

from backend.src.api.routes.github_routes import register_routes

class TestGithubRoutes(unittest.TestCase):
    def setUp(self):
        self.app = Flask(__name__)
        self.app.config['TESTING'] = True
        
        # Complete JWT configuration needed for testing
        self.app.config['JWT_SECRET_KEY'] = 'test-secret-key'
        self.app.config['JWT_TOKEN_LOCATION'] = ['headers']
        self.app.config['JWT_HEADER_NAME'] = 'Authorization'
        self.app.config['JWT_HEADER_TYPE'] = 'Bearer'
        self.app.config['JWT_ACCESS_TOKEN_EXPIRES'] = False
        
        # Create a Blueprint mock
        self.bp = MagicMock()
        self.bp.route = self.app.route
        
        # Apply JWT patch to bypass authentication
        self.patcher = patch('backend.src.api.routes.github_routes.jwt_required')
        self.mock_jwt_required = self.patcher.start()
        self.mock_jwt_required.return_value = lambda f: f
        
        # Register routes with our mocked Blueprint
        with self.app.app_context():
            register_routes(self.bp)
        
        self.client = self.app.test_client()
    
    def tearDown(self):
        self.patcher.stop()

    @patch('backend.src.api.routes.github_routes.initiate_github_auth')
    def test_github_auth_route(self, mock_controller):
        """Test the GitHub auth initialization route"""
        # Setup mocks - use Response instead of jsonify
        mock_controller.return_value = Response(
            json.dumps({'authorization_url': 'https://github.com/auth-url'}), 
            mimetype='application/json',
            status=200
        )
        
        # Add authorization header to bypass JWT check
        headers = {
            'Authorization': 'Bearer fake.jwt.token'
        }
        
        # Test endpoint
        response = self.client.get('/github/auth', headers=headers)
        data = json.loads(response.data)
        
        self.assertEqual(response.status_code, 200)
        self.assertIn('authorization_url', data)
        self.assertEqual(data['authorization_url'], 'https://github.com/auth-url')
        mock_controller.assert_called_once()

    @patch('backend.src.api.routes.github_routes.github_callback')
    def test_github_callback_route(self, mock_controller):
        # Setup mocks
        mock_controller.return_value = Response(
            json.dumps({'success': True}),
            mimetype='application/json',
            status=200
        )
        
        # Test callback endpoint (no JWT required)
        response = self.client.get('/github/callback?code=test-code&state=test-state')
        data = json.loads(response.data)
        
        self.assertEqual(response.status_code, 200)
        self.assertTrue(data['success'])
        mock_controller.assert_called_once()

    @patch('backend.src.api.routes.github_routes.get_github_repositories')
    def test_repositories_list_route(self, mock_controller):
        # Setup mocks
        mock_controller.return_value = Response(
            json.dumps({
                'repositories': [
                    {
                        'id': 1,
                        'name': 'repo1',
                        'full_name': 'user/repo1'
                    }
                ]
            }),
            mimetype='application/json',
            status=200
        )
        
        # Add authorization header to bypass JWT check
        headers = {
            'Authorization': 'Bearer fake.jwt.token'
        }
        
        # Test endpoint
        response = self.client.get('/github/repositories', headers=headers)
        data = json.loads(response.data)
        
        self.assertEqual(response.status_code, 200)
        self.assertIn('repositories', data)
        self.assertEqual(len(data['repositories']), 1)
        self.assertEqual(data['repositories'][0]['name'], 'repo1')
        mock_controller.assert_called_once()

    @patch('backend.src.api.routes.github_routes.validate_json')
    @patch('backend.src.api.routes.github_routes.add_github_repository')
    def test_add_repository_route(self, mock_controller, mock_validate_json):
        # Setup mocks
        mock_validate_json.return_value = lambda f: f
        
        mock_controller.return_value = Response(
            json.dumps({
                'message': 'Repository added successfully',
                'repository': {
                    'id': 1,
                    'name': 'owner/repo',
                    'url': 'https://github.com/owner/repo'
                }
            }),
            mimetype='application/json',
            status=201
        )
        
        # Add authorization header to bypass JWT check
        headers = {
            'Authorization': 'Bearer fake.jwt.token',
            'Content-Type': 'application/json'
        }
        
        # Test endpoint
        response = self.client.post(
            '/github/repositories',
            data=json.dumps({
                'repository_name': 'owner/repo',
                'repository_url': 'https://github.com/owner/repo'
            }),
            headers=headers
        )
        data = json.loads(response.data)
        
        self.assertEqual(response.status_code, 201)
        self.assertEqual(data['message'], 'Repository added successfully')
        self.assertEqual(data['repository']['name'], 'owner/repo')
        mock_controller.assert_called_once()

    @patch('backend.src.api.routes.github_routes.get_repository_issues')
    def test_repository_issues_route(self, mock_controller):
        # Setup mocks
        mock_controller.return_value = Response(
            json.dumps({
                'issues': [
                    {
                        'id': 101,
                        'number': 42,
                        'title': 'Test Issue',
                        'state': 'open'
                    }
                ]
            }),
            mimetype='application/json',
            status=200
        )
        
        # Add authorization header to bypass JWT check
        headers = {
            'Authorization': 'Bearer fake.jwt.token'
        }
        
        # Test endpoint
        response = self.client.get('/github/repositories/1/issues', headers=headers)
        data = json.loads(response.data)
        
        self.assertEqual(response.status_code, 200)
        self.assertIn('issues', data)
        self.assertEqual(len(data['issues']), 1)
        self.assertEqual(data['issues'][0]['title'], 'Test Issue')
        mock_controller.assert_called_with(1)

    @patch('backend.src.api.routes.github_routes.get_repository_pulls')
    def test_repository_pulls_route(self, mock_controller):
        # Setup mocks
        mock_controller.return_value = Response(
            json.dumps({
                'pull_requests': [
                    {
                        'id': 201,
                        'number': 5,
                        'title': 'Test PR',
                        'state': 'open'
                    }
                ]
            }),
            mimetype='application/json',
            status=200
        )
        
        # Add authorization header to bypass JWT check
        headers = {
            'Authorization': 'Bearer fake.jwt.token'
        }
        
        # Test endpoint
        response = self.client.get('/github/repositories/1/pulls', headers=headers)
        data = json.loads(response.data)
        
        self.assertEqual(response.status_code, 200)
        self.assertIn('pull_requests', data)
        self.assertEqual(len(data['pull_requests']), 1)
        self.assertEqual(data['pull_requests'][0]['title'], 'Test PR')
        mock_controller.assert_called_with(1)

    @patch('backend.src.api.routes.github_routes.validate_json')
    @patch('backend.src.api.routes.github_routes.link_task_with_github')
    def test_link_github_route(self, mock_controller, mock_validate_json):
        # Setup mocks
        mock_validate_json.return_value = lambda f: f
        
        mock_controller.return_value = Response(
            json.dumps({
                'message': 'Task linked with GitHub successfully',
                'link': {
                    'task_id': 1,
                    'repo_id': 2,
                    'issue_number': 3
                }
            }),
            mimetype='application/json',
            status=200
        )
        
        # Add authorization header to bypass JWT check
        headers = {
            'Authorization': 'Bearer fake.jwt.token',
            'Content-Type': 'application/json'
        }
        
        # Test endpoint
        response = self.client.post(
            '/tasks/1/github',
            data=json.dumps({'repo_id': 2, 'issue_number': 3}),
            headers=headers
        )
        data = json.loads(response.data)
        
        self.assertEqual(response.status_code, 200)
        self.assertEqual(data['message'], 'Task linked with GitHub successfully')
        self.assertEqual(data['link']['task_id'], 1)
        mock_controller.assert_called_with(1)

    @patch('backend.src.api.routes.github_routes.get_task_github_links')
    def test_get_github_links_route(self, mock_controller):
        # Setup mocks
        mock_controller.return_value = Response(
            json.dumps({
                'links': [
                    {
                        'id': 1,
                        'task_id': 10,
                        'repo_id': 2,
                        'repo_name': 'owner/repo',
                        'repo_url': 'https://github.com/owner/repo',
                        'issue_number': 42
                    }
                ]
            }),
            mimetype='application/json',
            status=200
        )
        
        # Add authorization header to bypass JWT check
        headers = {
            'Authorization': 'Bearer fake.jwt.token'
        }
        
        # Test endpoint
        response = self.client.get('/tasks/10/github', headers=headers)
        data = json.loads(response.data)
        
        self.assertEqual(response.status_code, 200)
        self.assertIn('links', data)
        self.assertEqual(len(data['links']), 1)
        self.assertEqual(data['links'][0]['task_id'], 10)
        self.assertEqual(data['links'][0]['issue_number'], 42)
        mock_controller.assert_called_with(10)

    @patch('backend.src.api.routes.github_routes.delete_task_github_link')
    def test_delete_github_link_route(self, mock_controller):
        # Setup mocks
        mock_controller.return_value = Response(
            json.dumps({
                'message': 'GitHub link removed from task'
            }),
            mimetype='application/json',
            status=200
        )
        
        # Add authorization header to bypass JWT check
        headers = {
            'Authorization': 'Bearer fake.jwt.token'
        }
        
        # Test endpoint
        response = self.client.delete('/tasks/10/github/1', headers=headers)
        data = json.loads(response.data)
        
        self.assertEqual(response.status_code, 200)
        self.assertEqual(data['message'], 'GitHub link removed from task')
        mock_controller.assert_called_with(10, 1)

if __name__ == '__main__':
    unittest.main()