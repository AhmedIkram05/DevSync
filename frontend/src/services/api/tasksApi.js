import axios from 'axios';

const BASE_URL = 'http://127.0.0.1:5000/api/v1/tasks'; // Adjust according to your API endpoint

export const tasksApi = {
  // Get all tasks
  getAllTasks: () => axios.get(`${BASE_URL}`),
  
  // Get single task
  getTaskById: (taskId) => axios.get(`${BASE_URL}/${taskId}`),
  
  // Update task
  updateTask: (taskId, data) => axios.put(`${BASE_URL}/${taskId}`, data),
  
  // Create new task
  createTask: (data) => axios.post(`${BASE_URL}`, data),
  
  // Delete task
  deleteTask: (taskId) => axios.delete(`${BASE_URL}/${taskId}`),
  
  // Add comment to task
  addComment: (taskId, comment) => axios.post(`${BASE_URL}/${taskId}/comments`, { comment }),
  // Add other task-related API calls as needed
}; 