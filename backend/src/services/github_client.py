"""
GitHub API client utilities for DevSync
"""
import os
import requests
import logging
from flask import current_app

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

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
        
        logger.info(f"Creating GitHub auth URL with client_id: {client_id}, redirect_uri: {redirect_uri}")
        
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
        
        logger.info(f"Exchanging code for token with GitHub...")
        logger.info(f"Using client_id: {client_id}")
        logger.info(f"Using redirect_uri: {redirect_uri}")
        logger.info(f"Code (first 10 chars): {code[:10]}...")
        
        # Create payload for token request
        data = {
            'client_id': client_id,
            'client_secret': client_secret,
            'code': code,
            'redirect_uri': redirect_uri
        }
        
        headers = {'Accept': 'application/json'}
        
        logger.info("Making POST request to GitHub for token exchange...")
        try:
            response = requests.post(
                GitHubClient.TOKEN_URL,
                data=data,
                headers=headers
            )
            
            status_code = response.status_code
            logger.info(f"GitHub token exchange response status: {status_code}")
            
            if status_code == 200:
                try:
                    response_json = response.json()
                    if 'error' in response_json:
                        logger.error(f"GitHub error response: {response_json['error']}")
                        if 'error_description' in response_json:
                            logger.error(f"Error description: {response_json['error_description']}")
                        return None
                    
                    logger.info("Successfully obtained access token from GitHub")
                    if 'access_token' in response_json:
                        token_preview = response_json['access_token'][:10] + '...' if response_json['access_token'] else 'None'
                        logger.info(f"Access token (first 10 chars): {token_preview}")
                        return response_json
                    else:
                        logger.warning("No access_token in response even though status was 200")
                        logger.warning(f"Response keys: {response_json.keys()}")
                        return None
                except Exception as e:
                    logger.error(f"Error parsing JSON response: {str(e)}")
                    logger.error(f"Raw response content: {response.text}")
                    return None
            else:
                logger.warning(f"Non-200 status code. Raw response: {response.text}")
                return None
        except Exception as e:
            logger.error(f"Exception during token exchange request: {str(e)}")
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
