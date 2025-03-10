import sys
import os
import json
import unittest
from unittest.mock import patch, MagicMock, PropertyMock
from flask import Flask, jsonify
from datetime import datetime, timedelta

# Set up proper import paths
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../../../..')))

class TestDashboardController(unittest.TestCase):
    def setUp(self):
        self.app = Flask(__name__)
        self.app.config['TESTING'] = True
        self.client = self.app.test_client()
        
        # Set up context
        self.app_context = self.app.app_context()
        self.app_context.push()
        
        # Mock classes and objects
        self.mock_db = MagicMock()
        self.mock_user = MagicMock()
        self.mock_project = MagicMock()
        self.mock_task = MagicMock()
        
        # Set up common mock return values
        self.mock_user.id = 1
        self.mock_user.name = "Test User"
        self.mock_user.role = "developer"
        
        self.mock_project.id = 1
        self.mock_project.name = "Test Project"
        self.mock_project.description = "A test project"
        self.mock_project.status = "active"
        self.mock_project.created_by = 1
        
        self.mock_task.id = 1
        self.mock_task.title = "Test Task"
        self.mock_task.status = "in_progress"
        self.mock_task.project_id = 1
        self.mock_task.assigned_to = 1
        self.mock_task.deadline = datetime.now() + timedelta(days=3)
        self.mock_task.updated_at = datetime.now()
        
        # Setup project team members
        self.mock_project.team_members = MagicMock()
        self.mock_project.team_members.all.return_value = [self.mock_user]
        
        # Setup user projects
        self.mock_user.projects = MagicMock()
        self.mock_user.projects.all.return_value = [self.mock_project]

    def tearDown(self):
        self.app_context.pop()

    @patch('backend.src.api.controllers.dashboard_controller.get_recent_completed_tasks')
    @patch('backend.src.api.controllers.dashboard_controller.get_tasks_due_soon')
    @patch('backend.src.api.controllers.dashboard_controller.get_user_tasks')
    @patch('backend.src.api.controllers.dashboard_controller.get_jwt_identity')
    @patch('backend.src.api.controllers.dashboard_controller.get_jwt')
    @patch('backend.src.api.controllers.dashboard_controller.User')
    @patch('backend.src.api.controllers.dashboard_controller.Task')
    @patch('backend.src.api.controllers.dashboard_controller.jsonify')
    def test_get_user_dashboard(self, mock_jsonify, mock_task_class, mock_user_class, mock_get_jwt, 
                              mock_jwt_identity, mock_get_user_tasks, mock_get_tasks_due_soon, 
                              mock_get_recent_completed_tasks):
        # Import locally to allow patching
        from backend.src.api.controllers.dashboard_controller import get_user_dashboard
        
        # Setup mocks
        mock_jwt_identity.return_value = {'user_id': 1}
        mock_get_jwt.return_value = {'role': 'developer'}
        mock_user_class.query.get_or_404.return_value = self.mock_user
        
        # Setup helper function mocks
        mock_get_user_tasks.return_value = [self.mock_task]
        mock_get_tasks_due_soon.return_value = [self.mock_task]
        mock_get_recent_completed_tasks.return_value = [self.mock_task]
        
        # Mock the task join query
        mock_join_query = MagicMock()
        mock_task_class.query.join.return_value = mock_join_query
        mock_join_query.filter.return_value = mock_join_query
        mock_join_query.all.return_value = [self.mock_task]
        
        # Mock jsonify to return a dict for easier assertions
        mock_jsonify.side_effect = lambda x: x
        
        # Call the function
        result = get_user_dashboard()
        
        # Check results
        self.assertIn('user', result)
        self.assertIn('tasks', result)
        self.assertIn('projects', result)
        
        # Check user data
        self.assertEqual(result['user']['id'], 1)
        self.assertEqual(result['user']['name'], 'Test User')
        
        # Check task data is present
        self.assertIn('assigned_count', result['tasks'])
        self.assertIn('pending_count', result['tasks'])
        self.assertIn('completed_count', result['tasks'])
        self.assertIn('due_soon', result['tasks'])
        
        # Check project data
        self.assertEqual(len(result['projects']), 1)
        self.assertEqual(result['projects'][0]['id'], 1)
        self.assertEqual(result['projects'][0]['name'], 'Test Project')

    @patch('backend.src.api.controllers.dashboard_controller.get_recent_updated_project_tasks')
    @patch('backend.src.api.controllers.dashboard_controller.get_project_tasks_due_soon')
    @patch('backend.src.api.controllers.dashboard_controller.get_project_tasks')
    @patch('backend.src.api.controllers.dashboard_controller.Project')
    @patch('backend.src.api.controllers.dashboard_controller.jsonify')
    def test_get_project_dashboard(self, mock_jsonify, mock_project_class, mock_get_project_tasks, 
                                mock_get_project_tasks_due_soon, mock_get_recent_updated_project_tasks):
        # Import locally to allow patching
        from backend.src.api.controllers.dashboard_controller import get_project_dashboard
        
        # Setup mocks
        mock_project_class.query.get_or_404.return_value = self.mock_project
        
        # Setup helper function mocks
        mock_get_project_tasks.return_value = [self.mock_task]
        mock_get_project_tasks_due_soon.return_value = [self.mock_task]
        mock_get_recent_updated_project_tasks.return_value = [self.mock_task]
        
        # Mock jsonify to return a dict for easier assertions
        mock_jsonify.side_effect = lambda x: x
        
        # Call the function
        result = get_project_dashboard(1)
        
        # Check results
        self.assertIn('project', result)
        self.assertIn('task_stats', result)
        self.assertIn('tasks_due_soon', result)
        self.assertIn('recently_updated_tasks', result)
        self.assertIn('team_members', result)
        
        # Check project data
        self.assertEqual(result['project']['id'], 1)
        self.assertEqual(result['project']['name'], 'Test Project')
        
        # Check task stats
        self.assertIn('total', result['task_stats'])
        self.assertIn('todo', result['task_stats'])
        self.assertIn('in_progress', result['task_stats'])
        
        # Check team members
        self.assertEqual(len(result['team_members']), 1)
        self.assertEqual(result['team_members'][0]['id'], 1)
        self.assertEqual(result['team_members'][0]['name'], 'Test User')

if __name__ == '__main__':
    unittest.main()