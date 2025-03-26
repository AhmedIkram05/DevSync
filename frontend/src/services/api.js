const API_URL = 'http://127.0.0.1:8000/api/v1';

// Helper functions for fetch API
const fetchWithAuth = async (url, options = {}) => {
  try {
    // Get auth token from localStorage
    const user = JSON.parse(localStorage.getItem('user'));
    
    // Set up headers
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };
    
    // Add auth token if available
    if (user && user.token) {
      headers.Authorization = `Bearer ${user.token}`;
    }
    
    // Make the request
    const response = await fetch(`${API_URL}${url}`, {
      ...options,
      headers,
      credentials: 'include', // Important for cookies/auth
    });
    
    // Check if response is ok (status 200-299)
    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new Error(errorData?.message || `Request failed with status ${response.status}`);
    }
    
    // Check if response is empty
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return await response.json();
    }
    
    return await response.text();
  } catch (error) {
    console.error('API request failed:', error);
    throw error;
  }
};

// Task related API calls
const taskService = {
  getAllTasks: async () => {
    return await fetchWithAuth('/tasks');
  },
  
  getTaskById: async (taskId) => {
    return await fetchWithAuth(`/tasks/${taskId}`);
  },
  
  createTask: async (taskData) => {
    return await fetchWithAuth('/tasks', {
      method: 'POST',
      body: JSON.stringify(taskData)
    });
  },
  
  updateTask: async (taskId, taskData) => {
    return await fetchWithAuth(`/tasks/${taskId}`, {
      method: 'PUT',
      body: JSON.stringify(taskData)
    });
  },
  
  updateTaskProgress: async (taskId, progressData) => {
    return await fetchWithAuth(`/tasks/${taskId}/progress`, {
      method: 'PATCH',
      body: JSON.stringify(progressData)
    });
  },
  
  deleteTask: async (taskId) => {
    return await fetchWithAuth(`/tasks/${taskId}`, {
      method: 'DELETE'
    });
  },
  
  getTaskComments: async (taskId) => {
    return await fetchWithAuth(`/tasks/${taskId}/comments`);
  },
  
  addTaskComment: async (taskId, commentData) => {
    return await fetchWithAuth(`/tasks/${taskId}/comments`, {
      method: 'POST',
      body: JSON.stringify(commentData)
    });
  }
};

// GitHub integration related API calls
const githubService = {
  getUserRepos: async () => {
    return await fetchWithAuth('/github/repos');
  },
  
  getIssues: async (repoId) => {
    return await fetchWithAuth(`/github/issues?repo_id=${repoId}`);
  },
  
  linkTaskToGithub: async (taskId, linkData) => {
    return await fetchWithAuth(`/github/link-task/${taskId}`, {
      method: 'POST',
      body: JSON.stringify(linkData)
    });
  },
  
  unlinkTaskFromGithub: async (taskId) => {
    return await fetchWithAuth(`/github/link-task/${taskId}`, {
      method: 'DELETE'
    });
  },
  
  initiateOAuthFlow: async () => {
    // Get the OAuth URL from the backend
    const data = await fetchWithAuth('/github/oauth-url');
    return data.url;
  },
  
  completeOAuthFlow: async (code) => {
    return await fetchWithAuth('/github/oauth-callback', {
      method: 'POST',
      body: JSON.stringify({ code })
    });
  },
  
  checkConnection: async () => {
    return await fetchWithAuth('/github/connection-status');
  },
  
  disconnectAccount: async () => {
    return await fetchWithAuth('/github/disconnect', {
      method: 'POST'
    });
  }
};

// User and developer related API calls
const userService = {
  getAllDevelopers: async () => {
    return await fetchWithAuth('/users?role=developer');
  },
  
  getDeveloperProgress: async (userId) => {
    return await fetchWithAuth(`/users/${userId}/progress`);
  }
};

// Dashboard and reporting related API calls
const dashboardService = {
  getAdminDashboardStats: async () => {
    return await fetchWithAuth('/dashboard/admin');
  },
  
  getClientDashboardStats: async () => {
    return await fetchWithAuth('/dashboard/client');
  },
  
  getReports: async (filters = {}) => {
    // Convert filters object to query string
    const queryParams = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, value);
      }
    });
    
    const queryString = queryParams.toString();
    return await fetchWithAuth(`/reports${queryString ? `?${queryString}` : ''}`);
  }
};

// Notification related API calls
const notificationService = {
  getNotifications: async () => {
    return await fetchWithAuth('/notifications');
  },
  
  markAsRead: async (notificationId) => {
    return await fetchWithAuth(`/notifications/${notificationId}/read`, {
      method: 'PATCH'
    });
  }
};

export {
  fetchWithAuth,
  taskService,
  githubService,
  userService,
  dashboardService,
  notificationService
};