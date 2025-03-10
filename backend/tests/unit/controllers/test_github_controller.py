import sys
import os
import unittest
from unittest.mock import patch, MagicMock, Mock
import json
import uuid
from datetime import datetime
from flask import Flask
from werkzeug.datastructures import ImmutableMultiDict

# Set up proper import paths
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../../../..')))

# Create mocks before importing the modules that use these objects
mock_request = Mock()
mock_jsonify = Mock()
mock_jwt = Mock()
mock_redirect = Mock()

# Apply patches to Flask objects before importing the target module
patch('flask.request', mock_request).start()
patch('flask.jsonify', mock_jsonify).start()
patch('flask_jwt_extended.get_jwt_identity', mock_jwt).start()
patch('flask.redirect', mock_redirect).start()

# Now import the functions to test
from backend.src.api.controllers.github_controller import (
    initiate_github_auth,
    github_callback,
    get_github_repositories,
    link_task_with_github
)

class TestGitHubController(unittest.TestCase):
    def setUp(self):
        self.app = Flask(__name__)
        self.app.config['TESTING'] = True
        self.app.config['FRONTEND_URL'] = 'http://localhost:3000'
        self.app_context = self.app.app_context()
        self.app_context.push()
        
        # Reset mocks for each test
        mock_request.reset_mock()
        mock_jsonify.reset_mock()
        mock_jwt.reset_mock()
        mock_redirect.reset_mock()
        
        # Set default return values
        mock_jwt.return_value = {'user_id': 1}
        mock_jsonify.side_effect = lambda x: x
        
    def tearDown(self):
        self.app_context.pop()

    @patch('backend.src.api.controllers.github_controller.GitHubClient')
    @patch('backend.src.api.controllers.github_controller.uuid.uuid4')
    def test_initiate_github_auth(self, mock_uuid, mock_github_client):
        # Setup mocks
        mock_uuid.return_value = 'test-uuid'
        mock_github_client.get_auth_url.return_value = 'https://github.com/auth-url'
        
        # Call the function
        result = initiate_github_auth()
        
        # Assertions
        self.assertIn('authorization_url', result)
        self.assertEqual(result['authorization_url'], 'https://github.com/auth-url')
        mock_github_client.get_auth_url.assert_called_with('test-uuid')

    @patch('backend.src.api.controllers.github_controller.GitHubClient')
    @patch('backend.src.api.controllers.github_controller.oauth_states')
    @patch('backend.src.api.controllers.github_controller.db')
    @patch('backend.src.api.controllers.github_controller.GitHubToken')
    @patch('backend.src.api.controllers.github_controller.User')
    def test_github_callback_success(self, mock_user_class, mock_token_class, 
                                   mock_db, mock_oauth_states, mock_github_client):
        # Setup mocks
        mock_request.args = ImmutableMultiDict([('code', 'test-code'), ('state', 'test-state')])
        
        mock_oauth_states.__contains__.return_value = True
        mock_oauth_states.__getitem__.return_value = {'user_id': 1}
        
        mock_github_client.exchange_code_for_token.return_value = {
            'access_token': 'test-access-token'
        }
        
        mock_client_instance = MagicMock()
        mock_github_client.return_value = mock_client_instance
        mock_client_instance.get_user_profile.return_value = {
            'login': 'testuser'
        }
        
        mock_user = MagicMock()
        mock_user_class.query.get.return_value = mock_user
        
        mock_token_class.query.filter_by.return_value.first.return_value = None
        
        # Call the function
        github_callback()
        
        # Assertions
        mock_redirect.assert_called_with('http://localhost:3000/github/connected?success=true')
        mock_db.session.add.assert_called_once()
        mock_db.session.commit.assert_called_once()
        self.assertEqual(mock_user.github_username, 'testuser')

    @patch('backend.src.api.controllers.github_controller.GitHubToken')
    @patch('backend.src.api.controllers.github_controller.GitHubClient')
    def test_get_github_repositories(self, mock_github_client, mock_token_class):
        # Setup mocks
        mock_token = MagicMock()
        mock_token.access_token = 'test-access-token'
        mock_token_class.query.filter_by.return_value.first.return_value = mock_token
        
        mock_client_instance = MagicMock()
        mock_github_client.return_value = mock_client_instance
        
        mock_client_instance.get_user_repositories.return_value = [
            {
                'id': 1,
                'name': 'repo1',
                'full_name': 'user/repo1',
                'owner': {'login': 'user'},
                'html_url': 'https://github.com/user/repo1',
                'description': 'Test repo 1',
                'private': False,
                'fork': False,
                'created_at': '2023-01-01T00:00:00Z',
                'updated_at': '2023-01-02T00:00:00Z',
                'pushed_at': '2023-01-03T00:00:00Z',
                'language': 'Python',
                'default_branch': 'main',
                'open_issues_count': 5
            }
        ]
        
        # Create a mock for request.args that supports the get() method with keyword arguments
        class MockArgs:
            def get(self, key, default=None, type=None):
                if key == 'page':
                    return 1 if type else '1'
                elif key == 'per_page':
                    return 10 if type else '10'
                return default

        mock_request.args = MockArgs()
        
        # Call the function
        result = get_github_repositories()
        
        # Assertions
        self.assertEqual(len(result['repositories']), 1)
        self.assertEqual(result['repositories'][0]['name'], 'repo1')
        mock_client_instance.get_user_repositories.assert_called_with(page=1, per_page=10)

    @patch('backend.src.api.controllers.github_controller.validate_task_github_link')
    @patch('backend.src.api.controllers.github_controller.Task')
    @patch('backend.src.api.controllers.github_controller.GitHubRepository')
    @patch('backend.src.api.controllers.github_controller.TaskGitHubLink')
    @patch('backend.src.api.controllers.github_controller.GitHubToken')
    @patch('backend.src.api.controllers.github_controller.GitHubClient')
    @patch('backend.src.api.controllers.github_controller.db')
    def test_link_task_with_github(self, mock_db, mock_github_client, mock_token_class, 
                               mock_link_class, mock_repo_class, mock_task_class, mock_validate):
        # Setup mocks
        mock_validate.return_value = None
        
        mock_request.get_json.return_value = {
            'repo_id': 1,
            'issue_number': 42
        }
        
        mock_task = MagicMock()
        mock_task.id = 10
        mock_task.title = 'Test Task'
        mock_task_class.query.get_or_404.return_value = mock_task
        
        mock_repo = MagicMock()
        mock_repo.repo_name = 'owner/repo'
        mock_repo_class.query.get_or_404.return_value = mock_repo
        
        mock_link_class.query.filter_by.return_value.first.return_value = None
        
        mock_token = MagicMock()
        mock_token.access_token = 'test-access-token'
        mock_token_class.query.filter_by.return_value.first.return_value = mock_token
        
        mock_client_instance = MagicMock()
        mock_github_client.return_value = mock_client_instance
        
        # Call the function
        result = link_task_with_github(10)
        
        # Assertions
        self.assertEqual(result['message'], 'Task linked with GitHub successfully')
        self.assertEqual(result['link']['task_id'], 10)
        self.assertEqual(result['link']['issue_number'], 42)
        mock_db.session.add.assert_called_once()
        mock_db.session.commit.assert_called_once()
        mock_client_instance.create_issue_comment.assert_called_once()

if __name__ == '__main__':
    unittest.main()