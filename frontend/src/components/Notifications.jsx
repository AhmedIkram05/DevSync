import React from 'react';
import { notificationService } from '../services/api';

function Notifications({ notifications, onNotificationUpdate }) {
  const handleNotificationClick = async (notificationId) => {
    try {
      await notificationService.markAsRead(notificationId);
      // Callback to parent to refresh notifications
      if (onNotificationUpdate) {
        onNotificationUpdate();
      }
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  if (!notifications?.length) {
    return (
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="text-gray-500 text-center">No new notifications</div>
      </div>
    );
  }

  return (
    <div className="bg-white p-4 rounded-lg shadow">
      <div className="space-y-2">
        {notifications.map((notification) => (
          <div 
            key={notification.id} 
            className={`p-3 ${notification.is_read ? 'bg-gray-50' : 'bg-blue-50'} rounded cursor-pointer hover:bg-gray-100`}
            onClick={() => handleNotificationClick(notification.id)}
          >
            <div className="flex justify-between items-start">
              <div>{notification.content}</div>
              <div className="text-xs text-gray-500">
                {new Date(notification.created_at).toLocaleDateString()}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Notifications;