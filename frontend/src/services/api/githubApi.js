import axios from 'axios';

const BASE_URL = 'http://127.0.0.1:8000/api/v1/github'; // Adjust according to your API endpoint

export const githubApi = {
  // Initialize GitHub OAuth flow
  initiateAuth: () => axios.get(`${BASE_URL}/auth`),
  
  // Get user's repositories
  getRepositories: () => axios.get(`${BASE_URL}/repositories`),
  
  // Get repository issues
  getRepositoryIssues: (repoId) => axios.get(`${BASE_URL}/repositories/${repoId}/issues`),
  
  // Link task with GitHub issue
  linkTaskWithGithub: (taskId, data) => axios.post(`${BASE_URL}/tasks/${taskId}/github`, data),
  
  // Get task's GitHub links
  getTaskGithubLinks: (taskId) => axios.get(`${BASE_URL}/tasks/${taskId}/github`),
}; 