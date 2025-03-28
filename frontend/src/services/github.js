// GitHub integration service with improved error handling and token management
import { authApi } from './utils/auth';

// Base URL for GitHub integration API endpoints
const BASE_URL = 'http://127.0.0.1:8000/api/v1/github';

// Helper function for making fetch requests with auth token and token refresh
const fetchWithAuth = async (url, options = {}) => {
  try {
    // Get the current user from localStorage
    let user = authApi.getCurrentUser();
    
    // Check if token needs refresh
    if (user && authApi.isTokenExpired()) {
      try {
        console.log('Token appears expired, attempting to refresh...');
        user = await authApi.refreshToken();
        console.log('Token refreshed successfully');
      } catch (refreshError) {
        console.error('Failed to refresh token:', refreshError);
        // Continue with the current token - the request will likely fail with 401
        // but we'll let the error handler below deal with that
      }
    }
    
    // Set up headers
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers
    };

    // Add token if available
    if (user && user.token) {
      headers['Authorization'] = `Bearer ${user.token}`;
      console.log(`Using auth token for GitHub request: ${user.token.substring(0, 10)}...`);
    } else {
      console.warn('No authentication token available for GitHub request');
    }

    // Configure fetch options
    const fetchOptions = {
      ...options,
      headers,
      credentials: 'include' // Include cookies
    };

    // Log the full request details (without sensitive info)
    console.log(`GitHub API Request: ${options.method || 'GET'} ${url}`);
    if (options.body) {
      try {
        const bodyObj = JSON.parse(options.body);
        console.log('Request body:', {
          ...bodyObj,
          code: bodyObj.code ? `${bodyObj.code.substring(0, 5)}...` : undefined,
          user_id: bodyObj.user_id ? `${String(bodyObj.user_id)}` : undefined
        });
      } catch (e) {
        console.log('Non-JSON body');
      }
    }

    // Make the request
    console.log(`Fetching ${url} with authenticated request`);
    const response = await fetch(url, fetchOptions);

    // Log response status
    console.log(`GitHub API Response: ${response.status} ${response.statusText}`);
    
    // Handle 401 Unauthorized - could be expired token
    if (response.status === 401) {
      console.log('Authentication failed (401). Token may be expired or invalid.');
      
      // Try to refresh the token if not already attempted
      if (!options.__tokenRefreshAttempted) {
        try {
          console.log('Attempting token refresh after 401...');
          const refreshedUser = await authApi.refreshToken();
          
          if (refreshedUser && refreshedUser.token) {
            console.log('Token refreshed after 401. Retrying original request...');
            
            // Retry the original request with new token
            return fetchWithAuth(url, {
              ...options,
              __tokenRefreshAttempted: true, // Mark that we already tried refresh
              headers: {
                ...options.headers,
                'Authorization': `Bearer ${refreshedUser.token}`
              }
            });
          }
        } catch (refreshError) {
          console.error('Token refresh after 401 failed:', refreshError);
          // Let it continue to the error throw below
        }
      }
      
      // If we get here, either token refresh failed or was already attempted
      const error = new Error('Authentication failed. Please log in again.');
      error.status = 401;
      error.isAuthError = true;
      throw error;
    }
    
    // For 500 Internal Server Error - provide more detailed error reporting
    if (response.status === 500) {
      let errorData = {};
      try {
        errorData = await response.json();
      } catch (e) {
        console.error('Failed to parse 500 error JSON response:', e);
        errorData = { message: 'Internal server error without details' };
      }
      
      console.error('GitHub API 500 Internal Server Error:', errorData);
      
      const errorMessage = errorData.message || errorData.error || 'Internal server error occurred. Please try again later.';
      const error = new Error(`Server Error: ${errorMessage}`);
      error.status = 500;
      error.data = errorData;
      error.isServerError = true;
      throw error;
    }
    
    // For rate limit errors
    if (response.status === 403) {
      const data = await response.json();
      if (data.message && data.message.includes('rate limit')) {
        const rateLimitError = new Error(data.message);
        rateLimitError.status = 403;
        rateLimitError.data = data;
        throw rateLimitError;
      }
    }
    
    // Handle other non-ok responses
    if (!response.ok) {
      // Try to get error message from the response
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.message || errorData.error || `HTTP error ${response.status}`;
      console.error(`GitHub API error (${response.status}):`, errorMessage);
      
      const error = new Error(errorMessage);
      error.status = response.status;
      error.data = errorData;
      throw error;
    }
    
    // Parse JSON for successful responses
    if (response.status !== 204) { // No content
      return await response.json();
    }
    
    return {}; // Return empty object for 204 No Content
  } catch (error) {
    console.error('GitHub API fetch error:', error);
    throw error;
  }
};

// GitHub integration API service
export const githubService = {
  // Check GitHub connection status
  checkConnectionStatus: async () => {
    try {
      console.log('Checking GitHub connection status...');
      const data = await fetchWithAuth(`${BASE_URL}/status`);
      return data;
    } catch (error) {
      console.error('Error checking GitHub connection status:', error);
      return { connected: false, error: error.message };
    }
  },
  
  // Alias for checkConnectionStatus to fix method name mismatch
  checkConnection: async () => {
    return githubService.checkConnectionStatus();
  },
  
  // Generate a state parameter with userId for GitHub OAuth
  createStateParam: (userId) => {
    // Create a simple state object with the user ID and a timestamp
    const stateObj = {
      userId: userId,
      timestamp: Date.now()
    };
    
    // Convert to base64
    return btoa(JSON.stringify(stateObj));
  },
  
  // Initiate GitHub OAuth flow
  initiateOAuthFlow: async () => {
    try {
      const user = authApi.getCurrentUser();
      
      // Check if we have a valid user with ID
      if (!user || !user.id) {
        throw new Error('User ID is required for GitHub connection. Please log in again.');
      }

      // Create a state parameter to verify the callback
      const state = githubService.createStateParam(user.id);
      
      // Enhanced payload with additional data to help backend process the request
      const response = await fetchWithAuth(`${BASE_URL}/connect`, {
        method: 'POST',
        body: JSON.stringify({
          userId: user.id,
          state: state
        })
      });
      
      // If we get an authorization URL, redirect to it
      if (response && response.authorization_url) {
        // Store the state in localStorage for verification on callback
        localStorage.setItem('github_oauth_state', state);
        // Return the URL for the component to handle the redirect
        return response.authorization_url;
      }
      
      throw new Error('No authorization URL received from server');
    } catch (error) {
      console.error('Error initiating GitHub OAuth flow:', error);
      throw error;
    }
  },
  
  // Complete GitHub OAuth flow with the code from callback
  completeOAuthFlow: async (code, state) => {
    try {
      console.log('Completing GitHub OAuth flow with code...');
      const user = authApi.getCurrentUser();
      
      if (!user || !user.id) {
        console.error('No authenticated user found for GitHub callback');
        throw new Error('Authentication required. Please log in again before connecting GitHub.');
      }
      
      // Verify the state parameter matches what we stored
      const storedState = localStorage.getItem('github_oauth_state');
      if (!state || state !== storedState) {
        console.error('OAuth state mismatch - potential CSRF attack');
        throw new Error('Security validation failed. Please try connecting to GitHub again.');
      }
      
      // Send the code to the backend along with user information
      const data = await fetchWithAuth(`${BASE_URL}/callback`, {
        method: 'POST',
        body: JSON.stringify({ 
          code,
          state
        })
      });
      
      // If successful, update the user's GitHub connection status
      if (data && data.success) {
        // Update the local user state with GitHub connection info
        authApi.updateGitHubStatus(
          true, 
          data.github_username || ''
        );
      }
      
      // Clean up the stored state
      localStorage.removeItem('github_oauth_state');
      
      return data;
    } catch (error) {
      console.error('Error completing GitHub OAuth flow:', error);
      throw error;
    }
  },
  
  // Get user's GitHub repositories
  getUserRepos: async () => {
    try {
      const data = await fetchWithAuth(`${BASE_URL}/repositories`);
      return data.repositories || data;
    } catch (error) {
      console.error('Error fetching GitHub repositories:', error);
      return { repositories: [], error: error.message };
    }
  },

  // Alias for getUserRepos to fix method name mismatch
  getUserRepositories: async (page = 1, perPage = 10) => {
    try {
      const queryParams = new URLSearchParams({
        page: page.toString(),
        per_page: perPage.toString()
      }).toString();
      
      const data = await fetchWithAuth(`${BASE_URL}/repositories?${queryParams}`);
      return data.repositories || data;
    } catch (error) {
      console.error('Error fetching GitHub repositories:', error);
      return { repositories: [], error: error.message };
    }
  },
  
  // Get repository issues
  getRepositoryIssues: async (repoId, options = {}) => {
    try {
      const { state = 'open', page = 1, perPage = 30 } = options;
      const queryParams = new URLSearchParams({
        state,
        page: page.toString(),
        per_page: perPage.toString()
      }).toString();
      
      const data = await fetchWithAuth(`${BASE_URL}/repositories/${repoId}/issues?${queryParams}`);
      return data.issues || data;
    } catch (error) {
      console.error(`Error fetching issues for repository ${repoId}:`, error);
      return { issues: [], error: error.message };
    }
  },
  
  // Get repository pull requests
  getRepositoryPulls: async (repoId, options = {}) => {
    try {
      const { state = 'open', page = 1, perPage = 30 } = options;
      const queryParams = new URLSearchParams({
        state,
        page: page.toString(),
        per_page: perPage.toString()
      }).toString();
      
      const data = await fetchWithAuth(`${BASE_URL}/repositories/${repoId}/pulls?${queryParams}`);
      return data.pull_requests || data;
    } catch (error) {
      console.error(`Error fetching pull requests for repository ${repoId}:`, error);
      return { pull_requests: [], error: error.message };
    }
  },
  
  // Add a repository to track
  addRepository: async (repositoryData) => {
    try {
      const data = await fetchWithAuth(`${BASE_URL}/repositories`, {
        method: 'POST',
        body: JSON.stringify(repositoryData)
      });
      return data;
    } catch (error) {
      console.error('Error adding GitHub repository:', error);
      throw error;
    }
  },
  
  // Link a task with GitHub issue or PR
  linkTaskWithGitHub: async (taskId, linkData) => {
    try {
      const data = await fetchWithAuth(`${BASE_URL}/tasks/${taskId}/github`, {
        method: 'POST',
        body: JSON.stringify(linkData)
      });
      return data;
    } catch (error) {
      console.error(`Error linking task ${taskId} with GitHub:`, error);
      throw error;
    }
  },
  
  // Get task's GitHub links
  getTaskGitHubLinks: async (taskId) => {
    try {
      const data = await fetchWithAuth(`${BASE_URL}/tasks/${taskId}/github`);
      return data.links || data;
    } catch (error) {
      console.error(`Error fetching GitHub links for task ${taskId}:`, error);
      return { links: [], error: error.message };
    }
  },
  
  // Delete a task's GitHub link
  deleteTaskGitHubLink: async (taskId, linkId) => {
    try {
      const data = await fetchWithAuth(`${BASE_URL}/tasks/${taskId}/github/${linkId}`, {
        method: 'DELETE'
      });
      return data;
    } catch (error) {
      console.error(`Error deleting GitHub link ${linkId} from task ${taskId}:`, error);
      throw error;
    }
  },
  
  // Disconnect GitHub account
  disconnectAccount: async () => {
    try {
      const data = await fetchWithAuth(`${BASE_URL}/disconnect`, {
        method: 'POST'
      });
      return data;
    } catch (error) {
      console.error('Error disconnecting GitHub account:', error);
      throw error;
    }
  },

  // Handle GitHub API rate limit errors
  handleRateLimitError: (error) => {
    // Check if error is related to rate limiting
    if (error?.status === 403 && error?.data?.message?.includes('rate limit')) {
      console.log('GitHub API rate limit error detected', error.data);
      
      // Extract rate limit information if available
      const rateLimitInfo = {
        title: 'GitHub API Rate Limit Exceeded',
        message: 'You have reached the GitHub API rate limit. Please wait before making more requests.',
        suggestion: 'Try again in a few minutes when the rate limit resets.'
      };
      
      // If we have detailed rate limit headers from GitHub, add them
      if (error.data?.documentation_url) {
        rateLimitInfo.documentationUrl = error.data.documentation_url;
      }
      
      return rateLimitInfo;
    }
    
    // Also check for 429 status code (Too Many Requests)
    if (error?.status === 429) {
      return {
        title: "GitHub API Rate Limit Exceeded",
        message: "You've reached GitHub's API rate limit. Please wait a few minutes and try again.",
        suggestion: "Try again later.",
        retryAfter: error.retryAfter || error.data?.retryAfter || 60
      };
    }
    
    // If it's not a rate limit error, return null
    return null;
  },

  // Handle any server errors - including 500 Internal Server Error
  handleServerError: (error) => {
    if (error?.status === 500 || error?.isServerError) {
      return {
        title: 'GitHub Integration Server Error',
        message: error.message || 'An internal server error occurred with the GitHub integration.',
        suggestion: 'Please try the following:',
        steps: [
          'Check that your GitHub account has the necessary permissions',
          'Make sure you are logged in to both DevSync and GitHub',
          'Try logging out and logging back in to refresh your session',
          'Check if the DevSync server is running correctly'
        ],
        technicalDetails: error.data || {}
      };
    }
    return null;
  }
};
