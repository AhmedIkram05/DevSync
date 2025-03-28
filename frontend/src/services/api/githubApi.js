import { authApi } from '../utils/auth';

const BASE_URL = 'http://127.0.0.1:8000/api/v1/github'; // API endpoint for GitHub integration

// Helper function for making authenticated fetch requests
const fetchWithAuth = async (url, options = {}) => {
  const user = authApi.getCurrentUser();
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  };

  if (user && user.token) {
    headers['Authorization'] = `Bearer ${user.token}`;
  }

  const fetchOptions = {
    ...options,
    headers,
    credentials: 'include'
  };

  const response = await fetch(url, fetchOptions);
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const error = new Error(errorData.message || `HTTP error ${response.status}`);
    error.status = response.status;
    error.data = errorData;
    throw error;
  }
  
  if (response.status !== 204) { // No Content
    return await response.json();
  }
  
  return {};
};

export const githubApi = {
  // Initialize GitHub OAuth flow
  initiateAuth: async () => {
    try {
      return await fetchWithAuth(`${BASE_URL}/auth`);
    } catch (error) {
      console.error('Error initiating GitHub auth:', error);
      throw error;
    }
  },
  
  // Get user's repositories
  getRepositories: async () => {
    try {
      return await fetchWithAuth(`${BASE_URL}/repositories`);
    } catch (error) {
      console.error('Error fetching repositories:', error);
      throw error;
    }
  },
  
  // Get repository issues
  getRepositoryIssues: async (repoId) => {
    try {
      return await fetchWithAuth(`${BASE_URL}/repositories/${repoId}/issues`);
    } catch (error) {
      console.error(`Error fetching issues for repository ${repoId}:`, error);
      throw error;
    }
  },
  
  // Link task with GitHub issue
  linkTaskWithGithub: async (taskId, data) => {
    try {
      return await fetchWithAuth(`${BASE_URL}/tasks/${taskId}/github`, {
        method: 'POST',
        body: JSON.stringify(data)
      });
    } catch (error) {
      console.error(`Error linking task ${taskId} with GitHub:`, error);
      throw error;
    }
  },
  
  // Get task's GitHub links
  getTaskGithubLinks: async (taskId) => {
    try {
      return await fetchWithAuth(`${BASE_URL}/tasks/${taskId}/github`);
    } catch (error) {
      console.error(`Error fetching GitHub links for task ${taskId}:`, error);
      throw error;
    }
  },
};