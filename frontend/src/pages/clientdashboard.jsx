import React, { useState, useEffect } from 'react';
import { dashboardApi } from '../services/api';
import TaskColumns from '../components/TaskColumns';
import Notifications from '../components/Notifications';
import GitHubActivity from '../components/GitHubActivity';

function ClientDashboard() {
  const [dashboardData, setDashboardData] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [gitHubActivity, setGitHubActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        // Fetch all data in parallel
        const [dashboardResponse, notificationsResponse, githubResponse] = await Promise.all([
          dashboardApi.getUserDashboard(),
          dashboardApi.getNotifications(),
          dashboardApi.getGitHubActivity()
        ]);

        setDashboardData(dashboardResponse.data);
        setNotifications(notificationsResponse.data.notifications);
        setGitHubActivity(githubResponse.data);
        setError(null);
      } catch (err) {
        setError('Failed to fetch dashboard data');
        console.error('Dashboard fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-xl text-red-600">{error}</div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Main Content */}
      <div className="flex-1 p-8">
        <h1 className="text-2xl font-semibold mb-6">
          Welcome, {dashboardData?.user?.name || 'User'}
        </h1>
        
        {/* Tasks Section */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Your Tasks</h2>
          <div className="flex gap-4 mb-4">
            <div className="bg-white rounded-lg p-4 shadow flex-1">
              <div className="text-2xl font-bold">{dashboardData?.tasks?.assigned_count || 0}</div>
              <div className="text-gray-600">Total Tasks</div>
            </div>
            <div className="bg-white rounded-lg p-4 shadow flex-1">
              <div className="text-2xl font-bold">{dashboardData?.tasks?.pending_count || 0}</div>
              <div className="text-gray-600">Pending Tasks</div>
            </div>
            <div className="bg-white rounded-lg p-4 shadow flex-1">
              <div className="text-2xl font-bold">{dashboardData?.tasks?.completed_count || 0}</div>
              <div className="text-gray-600">Completed Tasks</div>
            </div>
          </div>
          <TaskColumns tasks={dashboardData?.tasks} />
        </div>

        {/* Notifications Section */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Notifications</h2>
          <Notifications 
            notifications={notifications} 
            onNotificationUpdate={() => {
              // Refetch notifications
              dashboardApi.getNotifications()
                .then(response => setNotifications(response.data.notifications))
                .catch(error => console.error('Failed to refresh notifications:', error));
            }} 
          />
        </div>

        {/* GitHub Activity Section */}
        <div>
          <h2 className="text-xl font-semibold mb-4">GitHub Activity</h2>
          <GitHubActivity activity={gitHubActivity} />
        </div>
      </div>
    </div>
  );
}

export default ClientDashboard;