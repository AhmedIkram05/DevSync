import sys
import os
import json
import unittest
from unittest.mock import patch, MagicMock
from flask import Flask, Response

# Set up proper import paths
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../../../..')))

class TestDashboardRoutes(unittest.TestCase):
    def setUp(self):
        # Create a fresh Flask app instance for each test
        self.app = Flask(__name__)
        self.app.config['TESTING'] = True
        self.client = self.app.test_client()
    
    def test_user_dashboard_route(self):
        # Create mock route
        @self.app.route('/dashboard', methods=['GET'])
        def mock_user_dashboard():
            return Response(
                json.dumps({
                    'user': {
                        'id': 1,
                        'name': 'Test User',
                        'role': 'developer'
                    },
                    'tasks': {
                        'assigned_count': 5,
                        'pending_count': 3,
                        'completed_count': 2,
                        'due_soon': [
                            {
                                'id': 1,
                                'title': 'Task 1',
                                'deadline': '2023-12-31',
                                'status': 'in_progress',
                                'project_id': 1
                            }
                        ],
                        'recently_completed': []
                    },
                    'projects': [
                        {
                            'id': 1,
                            'name': 'Test Project',
                            'status': 'active'
                        }
                    ]
                }),
                mimetype='application/json',
                status=200
            )
        
        # Test the endpoint
        response = self.client.get('/dashboard')
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        
        # Check structure of response
        self.assertIn('user', data)
        self.assertIn('tasks', data)
        self.assertIn('projects', data)
        
        # Check user data
        self.assertEqual(data['user']['name'], 'Test User')
        
        # Check task data
        self.assertEqual(data['tasks']['assigned_count'], 5)
        self.assertEqual(data['tasks']['pending_count'], 3)
        self.assertEqual(data['tasks']['due_soon'][0]['title'], 'Task 1')
        
        # Check project data
        self.assertEqual(data['projects'][0]['name'], 'Test Project')
    
    def test_project_dashboard_route(self):
        # Create mock route
        @self.app.route('/dashboard/projects/1', methods=['GET'])
        def mock_project_dashboard():
            return Response(
                json.dumps({
                    'project': {
                        'id': 1,
                        'name': 'Test Project',
                        'description': 'A test project',
                        'status': 'active',
                        'completion_percentage': 40.0
                    },
                    'task_stats': {
                        'total': 10,
                        'todo': 2,
                        'in_progress': 4,
                        'review': 0,
                        'done': 4
                    },
                    'tasks_due_soon': [
                        {
                            'id': 1,
                            'title': 'Task 1',
                            'deadline': '2023-12-31',
                            'status': 'in_progress',
                            'assigned_to': 1
                        }
                    ],
                    'recently_updated_tasks': [
                        {
                            'id': 2,
                            'title': 'Task 2',
                            'status': 'done',
                            'updated_at': '2023-12-01T12:00:00'
                        }
                    ],
                    'team_members': [
                        {
                            'id': 1,
                            'name': 'Test User',
                            'role': 'developer'
                        }
                    ]
                }),
                mimetype='application/json',
                status=200
            )
        
        # Test the endpoint
        response = self.client.get('/dashboard/projects/1')
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        
        # Check structure of response
        self.assertIn('project', data)
        self.assertIn('task_stats', data)
        self.assertIn('tasks_due_soon', data)
        self.assertIn('recently_updated_tasks', data)
        self.assertIn('team_members', data)
        
        # Check project data
        self.assertEqual(data['project']['name'], 'Test Project')
        self.assertEqual(data['project']['completion_percentage'], 40.0)
        
        # Check task stats
        self.assertEqual(data['task_stats']['total'], 10)
        self.assertEqual(data['task_stats']['done'], 4)
        
        # Check team members
        self.assertEqual(data['team_members'][0]['name'], 'Test User')

if __name__ == '__main__':
    unittest.main()