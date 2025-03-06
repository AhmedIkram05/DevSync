# Notification data validation

from flask import jsonify

def validate_notification_data(data):
    """Validate notification data from requests"""
    # Check for required fields
    if not all(k in data for k in ['content', 'user_id']):
        return jsonify({'message': 'Missing required fields'}), 400
    
    # Validate content
    if len(data['content']) < 1 or len(data['content']) > 500:
        return jsonify({'message': 'Notification content must be between 1 and 500 characters'}), 400
    
    # Validate user_id
    if not isinstance(data['user_id'], int):
        return jsonify({'message': 'User ID must be an integer'}), 400
    
    # Validate task_id if provided
    if 'task_id' in data and data['task_id'] and not isinstance(data['task_id'], int):
        return jsonify({'message': 'Task ID must be an integer'}), 400
    
    # Validate is_read if provided
    if 'is_read' in data and not isinstance(data['is_read'], bool):
        return jsonify({'message': 'is_read must be a boolean value'}), 400
    
    # If validation passes, return None
    return None
