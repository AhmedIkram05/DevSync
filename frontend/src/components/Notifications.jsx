import React from 'react';
import { notificationService } from '../services/utils/api';

function Notifications({ notifications = [], onNotificationUpdate }) {
  const handleNotificationClick = async (notificationId) => {
    if (!notificationId) return;
    
    try {
      await notificationService.markAsRead(notificationId);
      // Callback to parent to refresh notifications
      if (typeof onNotificationUpdate === 'function') {
        onNotificationUpdate();
      }
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  // Safely handle empty notifications array
  if (!notifications || notifications.length === 0) {
    return (
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="text-gray-500 text-center">No new notifications</div>
      </div>
    );
  }

  return (
    <div className="bg-white p-4 rounded-lg shadow">
      <div className="space-y-2">
        {notifications.map((notification) => {
          // Ensure each notification has an id
          const notificationId = notification?.id || `notification-${Math.random().toString(36).substr(2, 9)}`;
          const isRead = notification?.is_read || false;
          const content = notification?.content || 'No content';
          const createdAt = notification?.created_at ? new Date(notification.created_at).toLocaleDateString() : 'Unknown date';
          
          return (
            <div 
              key={notificationId} 
              className={`p-3 ${isRead ? 'bg-gray-50' : 'bg-blue-50'} rounded cursor-pointer hover:bg-gray-100`}
              onClick={() => handleNotificationClick(notificationId)}
            >
              <div className="flex justify-between items-start">
                <div>{content}</div>
                <div className="text-xs text-gray-500">
                  {createdAt}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default Notifications;