"""GitHub integration API routes"""

from flask import request, jsonify, current_app, redirect
from flask_jwt_extended import jwt_required, get_jwt_identity
from ..controllers.github_controller import (
    initiate_github_auth,
    github_callback,
    get_github_repositories,
    add_github_repository,
    get_repository_issues,
    get_repository_pulls,
    link_task_with_github,
    get_task_github_links,
    delete_task_github_link,
    check_github_config
)
from ..middlewares.validation_middleware import validate_json
from ..middlewares import role_required
from ...auth.rbac import Role
from ...db.models import db, User, GitHubToken
from ...services.github_client import GitHubClient

def register_routes(bp):
    """Register all GitHub integration routes with the provided Blueprint"""
    
    @bp.route('/github/config-check', methods=['GET'])
    def github_config_check():
        """Route to check GitHub OAuth configuration"""
        return check_github_config()
    
    @bp.route('/github/auth', methods=['GET'])
    @jwt_required()
    def github_auth():
        """Route to initiate GitHub OAuth process"""
        return initiate_github_auth()
    
    @bp.route('/github/callback', methods=['GET', 'POST'])
    def github_oauth_callback():
        """Route to handle GitHub OAuth callback"""
        # For GET requests (coming from GitHub redirect)
        if request.method == 'GET':
            code = request.args.get('code')
            state = request.args.get('state')
            print(f"GitHub callback GET request received with code: {code[:10]}... and state: {state[:10]}...")
        # For POST requests (from frontend)
        else:
            data = request.get_json() or {}
            code = data.get('code')
            state = data.get('state')
            print(f"GitHub callback POST request received with code: {code[:10] if code else 'None'}... and state: {state[:10] if state else 'None'}...")
        
        if not code or not state:
            error_msg = 'Missing required parameters'
            print(f"Error in GitHub callback: {error_msg}")
            return jsonify({'error': error_msg}), 400
            
        try:
            # Parse state to get user_id
            import base64
            import json
            
            try:
                decoded_state = json.loads(base64.b64decode(state).decode('utf-8'))
                user_id = decoded_state.get('userId')
                print(f"Decoded state successfully. User ID: {user_id}")
            except Exception as e:
                print(f"Error decoding state: {str(e)}")
                return jsonify({'error': 'Invalid state parameter format'}), 400
            
            if not user_id:
                print("User ID not found in state")
                return jsonify({'error': 'Invalid state parameter - missing user ID'}), 400
            
            # Exchange the code for an access token
            print(f"Exchanging code for token...")
            token_data = GitHubClient.exchange_code_for_token(code)
            
            if not token_data or 'access_token' not in token_data:
                print("Failed to obtain access token")
                return jsonify({'error': 'Failed to obtain access token'}), 400
            
            print(f"Token obtained successfully")
            
            # Create GitHub client with new token
            github_client = GitHubClient(token_data['access_token'])
            
            # Fetch user profile to get GitHub username
            print("Fetching GitHub user profile")
            github_profile = github_client.get_user_profile()
            
            if not github_profile:
                print("Failed to fetch GitHub profile")
                return jsonify({'error': 'Failed to fetch GitHub profile'}), 400
            
            print(f"GitHub profile fetched: {github_profile.get('login')}")
            
            # Find the user
            user = User.query.get(user_id)
            if not user:
                print(f"User with ID {user_id} not found")
                return jsonify({'error': 'User not found'}), 404
            
            print(f"Found user: {user.email}")
            
            # Check if user already has a GitHub token
            existing_token = GitHubToken.query.filter_by(user_id=user_id).first()
            
            if existing_token:
                print("Updating existing GitHub token")
                existing_token.access_token = token_data['access_token']
                existing_token.scope = token_data.get('scope', '')
                existing_token.token_type = token_data.get('token_type', 'bearer')
            else:
                print("Creating new GitHub token record")
                # Create a new token record
                github_token = GitHubToken(
                    user_id=user_id,
                    access_token=token_data['access_token'],
                    scope=token_data.get('scope', ''),
                    token_type=token_data.get('token_type', 'bearer')
                )
                db.session.add(github_token)
            
            # Update user's GitHub username if available
            if github_profile and 'login' in github_profile:
                print(f"Updating user's GitHub username to {github_profile['login']}")
                user.github_username = github_profile['login']
                user.github_connected = True
            
            db.session.commit()
            print("Database updated successfully")
            
            # For GET requests (GitHub redirect), redirect back to frontend
            if request.method == 'GET':
                # Redirect back to frontend with success parameters
                frontend_url = current_app.config.get('FRONTEND_URL', 'http://localhost:3000')
                redirect_url = (f"{frontend_url}/github/callback?github_success=true"
                               f"&github_username={github_profile.get('login')}"
                               f"&user_id={user_id}")
                
                print(f"Redirecting to: {redirect_url}")
                return redirect(redirect_url)
            # For POST requests (from frontend), return JSON response
            else:
                return jsonify({
                    'success': True,
                    'github_username': github_profile.get('login'),
                    'message': 'GitHub account connected successfully'
                })
        
        except Exception as e:
            db.session.rollback()
            print(f"Error processing GitHub callback: {str(e)}")
            current_app.logger.error(f"Error processing GitHub callback: {str(e)}")
            
            # Depending on request type, respond accordingly
            if request.method == 'GET':
                # Redirect to frontend with error information
                frontend_url = current_app.config.get('FRONTEND_URL', 'http://localhost:3000')
                return redirect(f"{frontend_url}/github/callback?error=GitHub+connection+failed")
            else:
                return jsonify({
                    'success': False,
                    'message': f'Error processing GitHub callback: {str(e)}'
                }), 500
    
    @bp.route('/github/repositories', methods=['GET'])
    @jwt_required()
    def repositories_list():
        """Route to get GitHub repositories for the user"""
        return get_github_repositories()
    
    @bp.route('/github/repositories', methods=['POST'])
    @jwt_required()
    @validate_json()
    def add_repository():
        """Route to add a GitHub repository for tracking"""
        return add_github_repository()
    
    @bp.route('/github/repositories/<int:repo_id>/issues', methods=['GET'])
    @jwt_required()
    def repository_issues(repo_id):
        """Route to get issues for a repository"""
        return get_repository_issues(repo_id)
    
    @bp.route('/github/repositories/<int:repo_id>/pulls', methods=['GET'])
    @jwt_required()
    def repository_pulls(repo_id):
        """Route to get pull requests for a repository"""
        return get_repository_pulls(repo_id)
    
    @bp.route('/tasks/<int:task_id>/github', methods=['POST'])
    @jwt_required()
    @validate_json()
    def link_github(task_id):
        """Route to link a task with GitHub issue or PR"""
        return link_task_with_github(task_id)
    
    @bp.route('/tasks/<int:task_id>/github', methods=['GET'])
    @jwt_required()
    def get_github_links(task_id):
        """Route to get GitHub links for a task"""
        return get_task_github_links(task_id)
    
    @bp.route('/tasks/<int:task_id>/github/<int:link_id>', methods=['DELETE'])
    @jwt_required()
    def delete_github_link(task_id, link_id):
        """Route to delete a GitHub link from a task"""
        return delete_task_github_link(task_id, link_id)
    
    @bp.route('/github/exchange', methods=['GET'])
    def exchange_github_code():
        """Route to exchange GitHub OAuth code for token without authentication"""
        code = request.args.get('code')
        state = request.args.get('state')
        
        if not code:
            return jsonify({'success': False, 'message': 'No code provided'}), 400
            
        try:
            # Parse state to get user_id
            import base64
            import json
            
            decoded_state = json.loads(base64.b64decode(state).decode('utf-8'))
            user_id = decoded_state.get('userId')
            
            if not user_id:
                return jsonify({'success': False, 'message': 'Invalid state parameter'}), 400
                
            # Exchange the code for an access token
            token_data = GitHubClient.exchange_code_for_token(code)
            
            if not token_data or 'access_token' not in token_data:
                return jsonify({'success': False, 'message': 'Failed to obtain access token'}), 400
                
            # Create GitHub client with new token
            github_client = GitHubClient(token_data['access_token'])
            
            # Fetch user profile to get GitHub username
            github_profile = github_client.get_user_profile()
            
            if not github_profile:
                return jsonify({'success': False, 'message': 'Failed to fetch GitHub profile'}), 400
                
            # Find the user
            user = User.query.get(user_id)
            if not user:
                return jsonify({'success': False, 'message': 'User not found'}), 404
                
            # Check if user already has a GitHub token
            existing_token = GitHubToken.query.filter_by(user_id=user_id).first()
            
            if existing_token:
                existing_token.access_token = token_data['access_token']
                existing_token.scope = token_data.get('scope', '')
                existing_token.token_type = token_data.get('token_type', 'bearer')
            else:
                # Create a new token record
                github_token = GitHubToken(
                    user_id=user_id,
                    access_token=token_data['access_token'],
                    scope=token_data.get('scope', ''),
                    token_type=token_data.get('token_type', 'bearer')
                )
                db.session.add(github_token)
                
            # Update user's GitHub username if available
            if github_profile and 'login' in github_profile:
                user.github_username = github_profile['login']
                user.github_connected = True
                
            db.session.commit()
            
            return jsonify({
                'success': True, 
                'github_username': github_profile.get('login'),
                'message': 'GitHub account connected successfully'
            })
                
        except Exception as e:
            db.session.rollback()
            current_app.logger.error(f"Error processing GitHub exchange: {str(e)}")
            return jsonify({'success': False, 'message': str(e)}), 500

    @bp.route('/github/connect', methods=['GET', 'POST'])
    def github_connect():
        """Public route to initiate GitHub OAuth flow without requiring authentication"""
        # Handle both GET and POST requests
        if request.method == 'GET':
            user_id = request.args.get('userId')
            state = request.args.get('state')
        else:  # POST
            data = request.get_json() or {}
            user_id = data.get('userId')
            state = data.get('state')
        
        if not user_id:
            return jsonify({'error': 'User ID is required'}), 400
        
        # Directly redirect to GitHub OAuth
        client_id = current_app.config.get('GITHUB_CLIENT_ID')
        
        # CRITICAL: Use EXACTLY the same redirect URI as in GitHub OAuth App settings
        redirect_uri = current_app.config.get('GITHUB_REDIRECT_URI', 'http://localhost:8000/api/v1/github/callback')
        
        if not client_id:
            return jsonify({'error': 'GitHub OAuth configuration is incomplete'}), 500
        
        oauth_url = f"https://github.com/login/oauth/authorize?client_id={client_id}&redirect_uri={redirect_uri}&scope=user:email&state={state}"
        
        # Return the URL instead of redirecting
        return {'authorization_url': oauth_url}, 200

    @bp.route('/github/status', methods=['GET'])
    @jwt_required()
    def github_status():
        """Return the GitHub connection status for the authenticated user"""
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        if user:
            return jsonify({
                'connected': bool(user.github_connected),
                'username': user.github_username if user.github_connected else ''
            })
        return jsonify({'error': 'User not found'}), 404
