import React, { useState, useEffect } from 'react';
import { dashboardService, notificationService, taskService, githubService } from '../services/utils/api';
import { Link } from 'react-router-dom';
import TaskColumns from '../components/TaskColumns';
import Notifications from '../components/Notifications';
import GitHubActivity from '../components/GitHubActivity';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';

function ClientDashboard() {
  const { currentUser } = useAuth();
  const [dashboardData, setDashboardData] = useState({
    user: currentUser,
    tasks: {
      assigned_count: 0,
      pending_count: 0, 
      completed_count: 0,
      items: []
    }
  });
  const [notifications, setNotifications] = useState([]);
  const [gitHubActivity, setGitHubActivity] = useState([]);
  const [gitHubConnected, setGitHubConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        
        // Fetch dashboard stats
        const dashboardStats = await dashboardService.getClientDashboardStats();
        
        // Fetch tasks
        const tasksData = await taskService.getAllTasks();
        
        // Fetch notifications
        const notificationsData = await notificationService.getNotifications();
        
        // Try to fetch GitHub activity if user has connected their GitHub account
        let githubActivityData = [];
        try {
          const connectionStatus = await githubService.checkConnection();
          setGitHubConnected(connectionStatus.connected);
          
          if (connectionStatus.connected) {
            const repos = await githubService.getUserRepos();
            if (repos && repos.length > 0) {
              // If user has GitHub repos, get activity from the first one
              // In a real app, you might want to show activity across all repos
              const repoActivity = await githubService.getIssues(repos[0].id);
              githubActivityData = repoActivity || [];
            }
          }
        } catch (githubError) {
          console.warn('Could not fetch GitHub activity:', githubError);
          // Don't fail the entire dashboard load if GitHub fails
        }
        
        // Combine all data
        setDashboardData({
          user: currentUser,
          stats: dashboardStats || {},
          tasks: {
            assigned_count: tasksData.length,
            pending_count: tasksData.filter(task => task.status !== 'completed').length,
            completed_count: tasksData.filter(task => task.status === 'completed').length,
            items: tasksData
          }
        });
        
        setNotifications(notificationsData || []);
        setGitHubActivity(githubActivityData);
        setError(null);
      } catch (err) {
        console.error('Dashboard fetch error:', err);
        setError('Failed to fetch dashboard data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchDashboardData();
  }, [currentUser]);
  
  const handleRefreshDashboard = () => {
    setLoading(true);
    // Re-run the effect to fetch fresh data
    fetchDashboardData();
  };

  const fetchDashboardData = async () => {
    try {
      // Fetch dashboard stats
      const dashboardStats = await dashboardService.getClientDashboardStats();
      
      // Fetch tasks
      const tasksData = await taskService.getAllTasks();
      
      // Fetch notifications
      const notificationsData = await notificationService.getNotifications();
      
      // Try to fetch GitHub activity if user has connected their GitHub account
      let githubActivityData = [];
      try {
        const connectionStatus = await githubService.checkConnection();
        setGitHubConnected(connectionStatus.connected);
        
        if (connectionStatus.connected) {
          const repos = await githubService.getUserRepos();
          if (repos && repos.length > 0) {
            const repoActivity = await githubService.getIssues(repos[0].id);
            githubActivityData = repoActivity || [];
          }
        }
      } catch (githubError) {
        console.warn('Could not fetch GitHub activity:', githubError);
      }
      
      // Combine all data
      setDashboardData({
        user: currentUser,
        stats: dashboardStats || {},
        tasks: {
          assigned_count: tasksData.length,
          pending_count: tasksData.filter(task => task.status !== 'completed').length,
          completed_count: tasksData.filter(task => task.status === 'completed').length,
          items: tasksData
        }
      });
      
      setNotifications(notificationsData || []);
      setGitHubActivity(githubActivityData);
      setError(null);
    } catch (err) {
      console.error('Dashboard fetch error:', err);
      setError('Failed to fetch dashboard data. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <LoadingSpinner size="large" message="Loading your dashboard..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col h-screen items-center justify-center p-6">
        <div className="text-xl text-red-600 mb-4">{error}</div>
        <button 
          onClick={handleRefreshDashboard}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen p-4 md:p-8">
      {/* Main Content */}
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
          <h1 className="text-2xl font-bold mb-4 md:mb-0">
            Welcome, {dashboardData?.user?.name || 'Developer'}
          </h1>
          
          <button 
            onClick={handleRefreshDashboard}
            className="inline-flex items-center px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded"
          >
            <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh Dashboard
          </button>
        </div>
        
        {/* Tasks Overview Section */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Tasks Overview</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div className="bg-white rounded-lg p-6 shadow hover:shadow-md transition-shadow">
              <div className="flex items-center">
                <div className="rounded-full bg-blue-100 p-3 mr-4">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
                  </svg>
                </div>
                <div>
                  <div className="text-2xl font-bold">{dashboardData?.tasks?.assigned_count || 0}</div>
                  <div className="text-gray-600">Total Tasks</div>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg p-6 shadow hover:shadow-md transition-shadow">
              <div className="flex items-center">
                <div className="rounded-full bg-yellow-100 p-3 mr-4">
                  <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                </div>
                <div>
                  <div className="text-2xl font-bold">{dashboardData?.tasks?.pending_count || 0}</div>
                  <div className="text-gray-600">In Progress</div>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg p-6 shadow hover:shadow-md transition-shadow">
              <div className="flex items-center">
                <div className="rounded-full bg-green-100 p-3 mr-4">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                </div>
                <div>
                  <div className="text-2xl font-bold">{dashboardData?.tasks?.completed_count || 0}</div>
                  <div className="text-gray-600">Completed</div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Task Columns */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">Recent Tasks</h3>
              <Link to="/tasks" className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                View All Tasks
              </Link>
            </div>
            <TaskColumns tasks={dashboardData?.tasks?.items || []} />
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Notifications Section */}
          <div className="mb-8 lg:mb-0">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Recent Notifications</h2>
              <span className="text-sm text-gray-500">
                {notifications.length} notification{notifications.length !== 1 ? 's' : ''}
              </span>
            </div>
            <div className="bg-white rounded-lg shadow">
              <Notifications 
                notifications={notifications} 
                onNotificationUpdate={fetchDashboardData} 
              />
            </div>
          </div>
          
          {/* GitHub Activity Section */}
          <div>
            <h2 className="text-xl font-semibold mb-4">GitHub Activity</h2>
            <div className="bg-white rounded-lg shadow">
              {gitHubConnected ? (
                gitHubActivity.length > 0 ? (
                  <div className="p-6">
                    <GitHubActivity activity={gitHubActivity} />
                  </div>
                ) : (
                  <div className="p-6 text-center text-gray-500">
                    <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    <p>No recent GitHub activity</p>
                    <div className="mt-4">
                      <Link 
                        to="/github" 
                        className="inline-block px-4 py-2 bg-gray-800 text-white rounded hover:bg-gray-700"
                      >
                        View GitHub Repos
                      </Link>
                    </div>
                  </div>
                )
              ) : (
                <div className="p-6 text-center">
                  <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="currentColor" viewBox="0 0 24 24">
                    <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                  </svg>
                  <p className="text-gray-500 mb-4">Connect your GitHub account to track repository activity</p>
                  <Link 
                    to="/github" 
                    className="inline-block px-4 py-2 bg-gray-800 text-white rounded hover:bg-gray-700"
                  >
                    Connect GitHub
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ClientDashboard;