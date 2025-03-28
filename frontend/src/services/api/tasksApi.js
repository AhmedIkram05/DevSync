import { authApi } from '../utils/auth';

const BASE_URL = 'http://127.0.0.1:8000/api/v1/tasks'; // Adjust according to your API endpoint

// Helper function for making authenticated fetch requests
const fetchWithAuth = async (url, options = {}) => {
  try {
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
      credentials: 'include' // Include cookies
    };

    const response = await fetch(url, fetchOptions);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const error = new Error(errorData.message || `HTTP error ${response.status}`);
      error.status = response.status;
      error.data = errorData;
      throw error;
    }
    
    if (response.status !== 204) { // No content
      return await response.json();
    }
    
    return {}; // Return empty object for 204 No Content
  } catch (error) {
    console.error('Fetch error in tasksApi:', error);
    throw error;
  }
};

export const tasksApi = {
  // Get all tasks
  getAllTasks: async () => {
    return await fetchWithAuth(`${BASE_URL}`);
  },
  
  // Get single task
  getTaskById: async (taskId) => {
    return await fetchWithAuth(`${BASE_URL}/${taskId}`);
  },
  
  // Update task
  updateTask: async (taskId, data) => {
    return await fetchWithAuth(`${BASE_URL}/${taskId}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  },
  
  // Create new task
  createTask: async (data) => {
    return await fetchWithAuth(`${BASE_URL}`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },
  
  // Delete task
  deleteTask: async (taskId) => {
    return await fetchWithAuth(`${BASE_URL}/${taskId}`, {
      method: 'DELETE'
    });
  },
  
  // Add comment to task
  addComment: async (taskId, comment) => {
    return await fetchWithAuth(`${BASE_URL}/${taskId}/comments`, {
      method: 'POST',
      body: JSON.stringify({ comment })
    });
  }
  // Add other task-related API calls as needed
};