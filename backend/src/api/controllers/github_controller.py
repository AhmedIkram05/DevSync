"""Controller for GitHub integration with DevSync."""

import os
import uuid
import logging
from datetime import datetime
from flask import jsonify, request, url_for, current_app, redirect, session
from flask_jwt_extended import get_jwt_identity, jwt_required

from ...db.models import db, User, GitHubToken, GitHubRepository, TaskGitHubLink, Task, Notification
from ...services.github_client import GitHubClient  # Make sure this points to the correct location
from ..validators.github_validator import validate_github_auth, validate_github_repo_data, validate_task_github_link

logger = logging.getLogger(__name__)

# In-memory store for OAuth state parameters (in a production app, use Redis or similar)
oauth_states = {}

def initiate_github_auth():
    """Initiate GitHub OAuth flow"""
    # Generate a random state parameter to prevent CSRF
    state = str(uuid.uuid4())
    user_id = get_jwt_identity()['user_id']
    
    # Store state with user_id (with 10 minute expiry in a real app)
    oauth_states[state] = {
        'user_id': user_id,
        'created_at': datetime.now()
    }
    
    # Get authorization URL
    auth_url = GitHubClient.get_auth_url(state)
    
    return jsonify({
        'authorization_url': auth_url
    })

def github_callback():
    """Handle GitHub OAuth callback"""
    # Get code and state from query parameters
    code = request.args.get('code')
    state = request.args.get('state')
    
    # Validate the request
    if not code or not state:
        return jsonify({'message': 'Missing code or state parameter'}), 400
    
    # Verify state parameter
    if state not in oauth_states:
        return jsonify({'message': 'Invalid state parameter'}), 400
    
    # Get user_id from saved state
    user_id = oauth_states[state]['user_id']
    
    # Clean up used state
    del oauth_states[state]
    
    # Exchange code for access token
    token_data = GitHubClient.exchange_code_for_token(code)
    
    if not token_data or 'access_token' not in token_data:
        return jsonify({'message': 'Failed to obtain access token'}), 400
    
    # Create GitHub client with new token
    github_client = GitHubClient(token_data['access_token'])
    
    # Fetch user profile to get GitHub username
    github_profile = github_client.get_user_profile()
    if not github_profile:
        return jsonify({'message': 'Failed to fetch GitHub profile'}), 400
    
    # Check if user already has a GitHub token
    existing_token = GitHubToken.query.filter_by(user_id=user_id).first()
    
    if existing_token:
        # Update existing token
        existing_token.access_token = token_data['access_token']
        existing_token.refresh_token = token_data.get('refresh_token')
        existing_token.token_expires_at = token_data.get('token_expires_at')
    else:
        # Create new token record
        github_token = GitHubToken(
            user_id=user_id,
            access_token=token_data['access_token'],
            refresh_token=token_data.get('refresh_token'),
            token_expires_at=token_data.get('token_expires_at')
        )
        db.session.add(github_token)
    
    # Update user's GitHub username if available
    user = User.query.get(user_id)
    if user and github_profile and 'login' in github_profile:
        user.github_username = github_profile['login']
    
    db.session.commit()
    
    # Redirect to frontend with success message
    frontend_url = current_app.config.get('FRONTEND_URL', 'http://localhost:3000')
    return redirect(f"{frontend_url}/github/connected?success=true")

def get_github_repositories():
    """Get repositories for the authenticated user"""
    user_id = get_jwt_identity()['user_id']
    
    # Check if user has a GitHub token
    token = GitHubToken.query.filter_by(user_id=user_id).first()
    if not token:
        return jsonify({'message': 'GitHub account not connected'}), 401
    
    # Create GitHub client
    github_client = GitHubClient(token.access_token)
    
    # Fetch repositories (with pagination support)
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 30, type=int)
    
    repositories = github_client.get_user_repositories(page=page, per_page=per_page)
    
    # Format repository data
    formatted_repos = []
    for repo in repositories:
        formatted_repos.append({
            'id': repo['id'],
            'name': repo['name'],
            'full_name': repo['full_name'],
            'owner': repo['owner']['login'],
            'html_url': repo['html_url'],
            'description': repo['description'],
            'private': repo['private'],
            'fork': repo['fork'],
            'created_at': repo['created_at'],
            'updated_at': repo['updated_at'],
            'pushed_at': repo['pushed_at'],
            'language': repo['language'],
            'default_branch': repo['default_branch'],
            'open_issues_count': repo['open_issues_count']
        })
    
    return jsonify({
        'repositories': formatted_repos
    })

def add_github_repository():
    """Add a GitHub repository to track"""
    data = request.get_json()
    user_id = get_jwt_identity()['user_id']
    
    # Validate repository data
    validation_result = validate_github_repo_data(data)
    if validation_result:
        return validation_result
    
    # Check if user has a GitHub token
    token = GitHubToken.query.filter_by(user_id=user_id).first()
    if not token:
        return jsonify({'message': 'GitHub account not connected'}), 401
    
    # Create GitHub client
    github_client = GitHubClient(token.access_token)
    
    # Parse repository name (owner/repo)
    repo_parts = data['repository_name'].split('/')
    if len(repo_parts) != 2:
        return jsonify({'message': 'Invalid repository name format'}), 400
    
    owner, repo_name = repo_parts
    
    # Fetch repository details from GitHub
    repo_data = github_client.get_repository(owner, repo_name)
    if not repo_data:
        return jsonify({'message': 'Repository not found on GitHub'}), 404
    
    # Check if repository is already tracked
    existing_repo = GitHubRepository.query.filter_by(repo_url=data['repository_url']).first()
    if existing_repo:
        return jsonify({
            'message': 'Repository is already being tracked',
            'repository': {
                'id': existing_repo.id,
                'name': existing_repo.repo_name,
                'url': existing_repo.repo_url
            }
        }), 409
    
    # Create new repository record
    new_repo = GitHubRepository(
        repo_name=data['repository_name'],
        repo_url=data['repository_url'],
        github_id=repo_data['id']
    )
    
    db.session.add(new_repo)
    db.session.commit()
    
    return jsonify({
        'message': 'Repository added successfully',
        'repository': {
            'id': new_repo.id,
            'name': new_repo.repo_name,
            'url': new_repo.repo_url,
        }
    }), 201

def get_repository_issues(repo_id):
    """Get issues for a specific repository"""
    user_id = get_jwt_identity()['user_id']
    
    # Check if repo exists
    repo = GitHubRepository.query.get_or_404(repo_id)
    
    # Check if user has a GitHub token
    token = GitHubToken.query.filter_by(user_id=user_id).first()
    if not token:
        return jsonify({'message': 'GitHub account not connected'}), 401
    
    # Create GitHub client
    github_client = GitHubClient(token.access_token)
    
    # Parse repository name to get owner and repo
    repo_parts = repo.repo_name.split('/')
    if len(repo_parts) != 2:
        return jsonify({'message': 'Invalid repository name format'}), 400
    
    owner, repo_name = repo_parts
    
    # Fetch issues with query parameters
    state = request.args.get('state', 'open')
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 30, type=int)
    
    issues = github_client.get_repository_issues(
        owner=owner,
        repo=repo_name,
        state=state,
        page=page,
        per_page=per_page
    )
    
    # Format issue data
    formatted_issues = []
    for issue in issues:
        formatted_issues.append({
            'id': issue['id'],
            'number': issue['number'],
            'title': issue['title'],
            'state': issue['state'],
            'created_at': issue['created_at'],
            'updated_at': issue['updated_at'],
            'html_url': issue['html_url'],
            'body': issue['body'],
            'user': {
                'login': issue['user']['login'],
                'avatar_url': issue['user']['avatar_url'],
            },
            'labels': [{'name': label['name'], 'color': label['color']} for label in issue['labels']]
        })
    
    return jsonify({'issues': formatted_issues})

def get_repository_pulls(repo_id):
    """Get pull requests for a specific repository"""
    user_id = get_jwt_identity()['user_id']
    
    # Check if repo exists
    repo = GitHubRepository.query.get_or_404(repo_id)
    
    # Check if user has a GitHub token
    token = GitHubToken.query.filter_by(user_id=user_id).first()
    if not token:
        return jsonify({'message': 'GitHub account not connected'}), 401
    
    # Create GitHub client
    github_client = GitHubClient(token.access_token)
    
    # Parse repository name to get owner and repo
    repo_parts = repo.repo_name.split('/')
    if len(repo_parts) != 2:
        return jsonify({'message': 'Invalid repository name format'}), 400
    
    owner, repo_name = repo_parts
    
    # Fetch PRs with query parameters
    state = request.args.get('state', 'open')
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 30, type=int)
    
    pulls = github_client.get_repository_pulls(
        owner=owner,
        repo=repo_name,
        state=state,
        page=page,
        per_page=per_page
    )
    
    # Format PR data
    formatted_pulls = []
    for pr in pulls:
        formatted_pulls.append({
            'id': pr['id'],
            'number': pr['number'],
            'title': pr['title'],
            'state': pr['state'],
            'created_at': pr['created_at'],
            'updated_at': pr['updated_at'],
            'html_url': pr['html_url'],
            'body': pr['body'],
            'user': {
                'login': pr['user']['login'],
                'avatar_url': pr['user']['avatar_url'],
            },
            'labels': [{'name': label['name'], 'color': label['color']} for label in pr.get('labels', [])],
            'merged': pr.get('merged', False),
            'mergeable': pr.get('mergeable'),
            'draft': pr.get('draft', False)
        })
    
    return jsonify({'pull_requests': formatted_pulls})

def link_task_with_github(task_id):
    """Link a task with a GitHub issue or PR"""
    data = request.get_json()
    user_id = get_jwt_identity()['user_id']
    
    # Validate link data
    validation_result = validate_task_github_link(data)
    if validation_result:
        return validation_result
    
    # Check if task exists
    task = Task.query.get_or_404(task_id)
    
    # Check if repo exists
    repo = GitHubRepository.query.get_or_404(data['repo_id'])
    
    # Check if link already exists
    existing_link = TaskGitHubLink.query.filter_by(
        task_id=task_id,
        repo_id=data['repo_id']
    ).first()
    
    if existing_link:
        # Update existing link
        if 'issue_number' in data:
            existing_link.issue_number = data['issue_number']
        if 'pull_request_number' in data:
            existing_link.pull_request_number = data['pull_request_number']
    else:
        # Create new link
        new_link = TaskGitHubLink(
            task_id=task_id,
            repo_id=data['repo_id'],
            issue_number=data.get('issue_number'),
            pull_request_number=data.get('pull_request_number')
        )
        db.session.add(new_link)
    
    db.session.commit()
    
    # If we have a GitHub token, add a comment to the issue/PR referencing this task
    token = GitHubToken.query.filter_by(user_id=user_id).first()
    if token and (data.get('issue_number') or data.get('pull_request_number')):
        github_client = GitHubClient(token.access_token)
        
        # Parse repository name
        repo_parts = repo.repo_name.split('/')
        if len(repo_parts) == 2:
            owner, repo_name = repo_parts
            
            # Construct comment with link to DevSync task
            frontend_url = current_app.config.get('FRONTEND_URL', 'http://localhost:3000')
            comment = f"This issue is linked to DevSync task #{task.id}: {task.title}\n\n"
            comment += f"[View in DevSync]({frontend_url}/tasks/{task.id})"
            
            # Add comment to issue or PR
            if data.get('issue_number'):
                github_client.create_issue_comment(owner, repo_name, data['issue_number'], comment)
            elif data.get('pull_request_number'):
                github_client.create_issue_comment(owner, repo_name, data['pull_request_number'], comment)
    
    return jsonify({
        'message': 'Task linked with GitHub successfully',
        'link': {
            'task_id': task_id,
            'repo_id': data['repo_id'],
            'repo_name': repo.repo_name,
            'issue_number': data.get('issue_number'),
            'pull_request_number': data.get('pull_request_number')
        }
    })

def get_task_github_links(task_id):
    """Get all GitHub links for a task"""
    # Check if task exists
    task = Task.query.get_or_404(task_id)
    
    # Get all links for this task
    links = TaskGitHubLink.query.filter_by(task_id=task_id).all()
    
    # Format link data
    formatted_links = []
    for link in links:
        repo = GitHubRepository.query.get(link.repo_id)
        formatted_links.append({
            'id': link.id,
            'task_id': link.task_id,
            'repo_id': link.repo_id,
            'repo_name': repo.repo_name if repo else None,
            'repo_url': repo.repo_url if repo else None,
            'issue_number': link.issue_number,
            'pull_request_number': link.pull_request_number,
            'created_at': link.created_at.isoformat() if link.created_at else None
        })
    
    return jsonify({'links': formatted_links})

def delete_task_github_link(task_id, link_id):
    """Delete a GitHub link from a task"""
    # Check if task exists
    task = Task.query.get_or_404(task_id)
    
    # Find the link
    link = TaskGitHubLink.query.get_or_404(link_id)
    
    # Verify link belongs to the task
    if link.task_id != task_id:
        return jsonify({'message': 'Link does not belong to this task'}), 400
        
    # Delete the link
    db.session.delete(link)
    db.session.commit()
    
    return jsonify({'message': 'GitHub link removed from task'})