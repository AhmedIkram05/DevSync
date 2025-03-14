"""
GitHub API client utilities for DevSync
"""
import os
import requests
from flask import current_app

class GitHubClient:
    """Client for the GitHub API"""
    
    BASE_API_URL = "https://api.github.com"
    AUTH_URL = "https://github.com/login/oauth/authorize"
    TOKEN_URL = "https://github.com/login/oauth/access_token"
    
    def __init__(self, access_token=None):
        self.access_token = access_token
        
    @staticmethod
    def get_auth_url(state):
        """
        Get the GitHub OAuth authorization URL
        """
        client_id = current_app.config.get('GITHUB_CLIENT_ID')
        redirect_uri = current_app.config.get('GITHUB_REDIRECT_URI')
        
        return (
            f"{GitHubClient.AUTH_URL}?"
            f"client_id={client_id}&"
            f"redirect_uri={redirect_uri}&"
            f"state={state}&"
            f"scope=repo user"
        )
    
    @staticmethod
    def exchange_code_for_token(code):
        """
        Exchange authorization code for access token
        """
        client_id = current_app.config.get('GITHUB_CLIENT_ID')
        client_secret = current_app.config.get('GITHUB_CLIENT_SECRET')
        redirect_uri = current_app.config.get('GITHUB_REDIRECT_URI')
        
        response = requests.post(
            GitHubClient.TOKEN_URL,
            data={
                'client_id': client_id,
                'client_secret': client_secret,
                'code': code,
                'redirect_uri': redirect_uri
            },
            headers={'Accept': 'application/json'}
        )
        
        if response.status_code == 200:
            return response.json()
        return None
    
    def get_headers(self):
        """Get headers with authorization for API requests"""
        return {
            'Authorization': f'token {self.access_token}',
            'Accept': 'application/vnd.github.v3+json'
        }
    
    def get_user_profile(self):
        """Get authenticated user's GitHub profile"""
        response = requests.get(
            f"{self.BASE_API_URL}/user",
            headers=self.get_headers()
        )
        
        if response.status_code == 200:
            return response.json()
        return None
    
    def get_user_repositories(self, page=1, per_page=30):
        """Get repositories for the authenticated user"""
        response = requests.get(
            f"{self.BASE_API_URL}/user/repos",
            params={
                'page': page,
                'per_page': per_page,
                'sort': 'updated',
                'affiliation': 'owner,collaborator,organization_member'
            },
            headers=self.get_headers()
        )
        
        if response.status_code == 200:
            return response.json()
        return []
    
    def get_repository(self, owner, repo):
        """Get a specific repository by owner and name"""
        response = requests.get(
            f"{self.BASE_API_URL}/repos/{owner}/{repo}",
            headers=self.get_headers()
        )
        
        if response.status_code == 200:
            return response.json()
        return None
    
    def get_repository_issues(self, owner, repo, state='open', page=1, per_page=30):
        """Get issues for a repository"""
        response = requests.get(
            f"{self.BASE_API_URL}/repos/{owner}/{repo}/issues",
            params={
                'state': state,
                'page': page,
                'per_page': per_page
            },
            headers=self.get_headers()
        )
        
        if response.status_code == 200:
            return response.json()
        return []
    
    def get_repository_pulls(self, owner, repo, state='open', page=1, per_page=30):
        """Get pull requests for a repository"""
        response = requests.get(
            f"{self.BASE_API_URL}/repos/{owner}/{repo}/pulls",
            params={
                'state': state,
                'page': page,
                'per_page': per_page
            },
            headers=self.get_headers()
        )
        
        if response.status_code == 200:
            return response.json()
        return []
    
    def create_issue_comment(self, owner, repo, issue_number, body):
        """Add a comment to an issue or pull request"""
        response = requests.post(
            f"{self.BASE_API_URL}/repos/{owner}/{repo}/issues/{issue_number}/comments",
            json={'body': body},
            headers=self.get_headers()
        )
        
        if response.status_code in (201, 200):
            return response.json()
        return None
