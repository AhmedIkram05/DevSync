const API_URL = 'http://localhost:8000/api/v1';  // Updated to port 8000 to match backend

// Improved fetchWithAuth function with better error handling and CORS settings
const fetchWithAuth = async (url, options = {}) => {
  try {
    // Get auth token from localStorage with improved error handling
    let user = null;
    try {
      const userStr = localStorage.getItem('user');
      user = userStr ? JSON.parse(userStr) : null;
    } catch (e) {
      console.error("Error parsing user from localStorage:", e);
      localStorage.removeItem('user'); // Clear corrupted data
    }
    
    // Set up headers
    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...options.headers,
    };
    
    // Add auth token if available with detailed logging
    if (user && user.token) {
      console.log(`Request to ${url} with token: ${user.token.substring(0, 15)}...`);
      headers.Authorization = `Bearer ${user.token}`;
    } else {
      console.warn(`No authentication token found for request: ${url}`);
      
      // For public endpoints, continue without token
      // For protected endpoints requiring auth, this will fail with 401
      if (!url.startsWith('/auth/') && 
          !url.startsWith('/github/config-check') && 
          !url.startsWith('/github/connect') && 
          !url.startsWith('/github/exchange')) {
        throw new Error('Authentication token is required for this request');
      }
    }
    
    // Configure fetch with appropriate CORS settings
    const fetchOptions = {
      ...options,
      headers,
      credentials: 'include', // Important for cookies/auth
      mode: 'cors', // Explicitly set CORS mode
    };

    // Make the request with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout
    
    try {
      const response = await fetch(`${API_URL}${url}`, {
        ...fetchOptions,
        signal: controller.signal
      });
      
      clearTimeout(timeoutId); // Clear the timeout if request completes
      
      // Check if response is ok (status 200-299)
      if (!response.ok) {
        if (response.status === 401) {
          // Authentication error - handle token expiration
          console.error('Authentication failed. Token may be expired or invalid.');
          
          // Check if this is a non-critical endpoint (like notifications)
          if (url.includes('/notifications')) {
            // For non-critical endpoints, return empty data instead of throwing
            console.warn('Returning empty data for non-critical endpoint due to auth error');
            return { data: [] };
          }
          
          throw new Error('Authentication token is missing or invalid. Please log in again.');
        }
        
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Request failed with status: ${response.status}`);
      }
      
      // Parse JSON response
      const data = await response.json().catch(() => ({}));
      return data;
    } finally {
      clearTimeout(timeoutId);
    }
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

// Enhanced GitHub integration related API calls with better OAuth flow
const githubService = {
  getUserRepos: async () => {
    try {
      const result = await fetchWithAuth('/github/repositories');
      console.log("Retrieved repositories:", result);
      return result.repositories || result;
    } catch (error) {
      console.error("Failed to get GitHub repositories:", error);
      throw error;
    }
  },
  
  getIssues: async (repoId) => {
    return await fetchWithAuth(`/github/repositories/${repoId}/issues`);
  },
  
  linkTaskToGithub: async (taskId, linkData) => {
    return await fetchWithAuth(`/tasks/${taskId}/github`, {
      method: 'POST',
      body: JSON.stringify(linkData)
    });
  },
  
  unlinkTaskFromGithub: async (taskId, linkId) => {
    return await fetchWithAuth(`/tasks/${taskId}/github/${linkId}`, {
      method: 'DELETE'
    });
  },
  
  // Enhanced function to get the OAuth URL for GitHub integration
  initiateOAuthFlow: async () => {
    try {
      console.log("Initiating GitHub OAuth flow...");
      const data = await fetchWithAuth('/github/auth');
      
      if (!data || !data.authorization_url) {
        console.error("Invalid response from GitHub auth endpoint:", data);
        throw new Error("Could not get GitHub authorization URL");
      }
      
      console.log("Received authorization URL:", data.authorization_url);
      return data.authorization_url;
    } catch (error) {
      console.error("Error initiating GitHub OAuth flow:", error);
      throw error;
    }
  },
  
  // Enhanced function to handle OAuth callback
  completeOAuthFlow: async (code) => {
    try {
      console.log("Completing GitHub OAuth flow with code...");
      
      // Call the exchange endpoint with the code
      const result = await fetchWithAuth('/github/callback', {
        method: 'POST',
        body: JSON.stringify({ code })
      });
      
      console.log("GitHub OAuth flow completed:", result);
      return result;
    } catch (error) {
      console.error("Failed to complete GitHub OAuth flow:", error);
      throw error;
    }
  },
  
  // Improved GitHub connection status check
  checkConnection: async () => {
    try {
      console.log("Checking GitHub connection status...");
      const connectionStatus = await fetchWithAuth('/github/status');
      
      return {
        connected: connectionStatus.connected || false,
        username: connectionStatus.username || ''
      };
    } catch (error) {
      console.error("Error checking GitHub connection:", error);
      // Return disconnected state on error
      return { connected: false, username: '' };
    }
  },
  
  // Disconnect GitHub account
  disconnectAccount: async () => {
    try {
      console.log("Disconnecting GitHub account...");
      return await fetchWithAuth('/github/disconnect', {
        method: 'POST'
      });
    } catch (error) {
      console.error("Failed to disconnect GitHub account:", error);
      throw error;
    }
  },
  
  // Get a specific GitHub repository
  getRepository: async (repoId) => {
    return await fetchWithAuth(`/github/repositories/${repoId}`);
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

// Enhanced notifications API calls
const notificationService = {
  getNotifications: async () => {
    try {
      const result = await fetchWithAuth('/notifications');
      return result.data || [];
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
      // Return empty array instead of throwing to prevent UI errors
      return [];
    }
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