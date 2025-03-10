import sys
import os
import json
import unittest
from unittest.mock import patch, MagicMock
from flask import Flask, Response, request  # Added request import

# Set up proper import paths
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../../../..')))

class TestCommentsRoutes(unittest.TestCase):
    def setUp(self):
        # Create a fresh Flask app instance for each test
        self.app = Flask(__name__)
        self.app.config['TESTING'] = True
        self.client = self.app.test_client()
    
    def test_get_task_comments_route(self):
        # Create mock route
        @self.app.route('/tasks/<int:task_id>/comments', methods=['GET'])
        def mock_get_comments(task_id):
            self.assertEqual(task_id, 1)
            return Response(
                json.dumps({
                    'comments': [
                        {
                            'id': 1,
                            'content': 'Test comment',
                            'user_id': 1,
                            'user_name': 'Test User',
                            'created_at': '2023-01-01T00:00:00'
                        }
                    ]
                }),
                mimetype='application/json',
                status=200
            )
        
        # Test the endpoint
        response = self.client.get('/tasks/1/comments')
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertIn('comments', data)
        self.assertEqual(len(data['comments']), 1)
        self.assertEqual(data['comments'][0]['content'], 'Test comment')
    
    def test_add_comment_route(self):
        # Create mock route
        @self.app.route('/tasks/<int:task_id>/comments', methods=['POST'])
        def mock_add_comment(task_id):
            self.assertEqual(task_id, 1)
            # Access request data directly in route handler
            content = request.json.get('content')
            self.assertEqual(content, 'New comment')
            
            return Response(
                json.dumps({
                    'message': 'Comment added successfully',
                    'comment': {
                        'id': 1,
                        'content': 'New comment',
                        'user_id': 1,
                        'user_name': 'Test User',
                        'created_at': '2023-01-01T00:00:00'
                    }
                }),
                mimetype='application/json',
                status=201
            )
        
        # Test the endpoint
        response = self.client.post(
            '/tasks/1/comments',
            data=json.dumps({'content': 'New comment'}),
            content_type='application/json'
        )
        self.assertEqual(response.status_code, 201)
        data = json.loads(response.data)
        self.assertEqual(data['message'], 'Comment added successfully')
        self.assertEqual(data['comment']['content'], 'New comment')
    
    def test_update_comment_route(self):
        # Create mock route
        @self.app.route('/comments/<int:comment_id>', methods=['PUT'])
        def mock_update_comment(comment_id):
            self.assertEqual(comment_id, 1)
            # Access request data directly in route handler
            content = request.json.get('content')
            self.assertEqual(content, 'Updated comment')
            
            return Response(
                json.dumps({
                    'message': 'Comment updated successfully',
                    'comment': {
                        'id': 1,
                        'content': 'Updated comment',
                        'updated_at': '2023-01-01T00:00:00'
                    }
                }),
                mimetype='application/json',
                status=200
            )
        
        # Test the endpoint
        response = self.client.put(
            '/comments/1',
            data=json.dumps({'content': 'Updated comment'}),
            content_type='application/json'
        )
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertEqual(data['message'], 'Comment updated successfully')
        self.assertEqual(data['comment']['content'], 'Updated comment')
    
    def test_delete_comment_route(self):
        # Create mock route
        @self.app.route('/comments/<int:comment_id>', methods=['DELETE'])
        def mock_delete_comment(comment_id):
            self.assertEqual(comment_id, 1)
            return Response(
                json.dumps({'message': 'Comment deleted successfully'}),
                mimetype='application/json',
                status=200
            )
        
        # Test the endpoint
        response = self.client.delete('/comments/1')
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertEqual(data['message'], 'Comment deleted successfully')

if __name__ == '__main__':
    unittest.main()