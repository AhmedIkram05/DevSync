import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import io from 'socket.io-client';

const NotificationContext = createContext();

export const useNotifications = () => useContext(NotificationContext);

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [socket, setSocket] = useState(null);
  const [error, setError] = useState(null);
  
  const { currentUser } = useAuth();

  // Memoize the fetchNotifications function to prevent unnecessary re-renders
  const fetchNotifications = useCallback(async () => {
    if (!currentUser) {
      console.log('No user logged in, skipping notification fetch');
      return;
    }
    
    try {
      // Import dynamically to prevent circular dependencies
      const { notificationService } = await import('../services/utils/api');
      
      const notificationData = await notificationService.getNotifications();
      
      // Even if there's an error, notificationService now returns an empty array
      // which is safer for the UI
      setNotifications(notificationData);
      
      // Count unread notifications
      const unreadNotifications = notificationData.filter(n => !n.read);
      setUnreadCount(unreadNotifications.length);
      
      setError(null); // Clear any previous errors
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
      // Don't set error state to prevent UI problems - just log it
      // setError('Failed to load notifications');
    }
  }, [currentUser]);

  // Handle socket.io connection
  useEffect(() => {
    if (!currentUser) {
      return;
    }

    // Connect to socket server with auth token
    const newSocket = io('http://localhost:8000', {
      transports: ['websocket'],
      auth: {
        token: currentUser.token
      },
      autoConnect: true,
      reconnection: true
    });

    newSocket.on('connect', () => {
      console.log('Socket.IO connected');
    });

    newSocket.on('disconnect', () => {
      console.log('Socket.IO disconnected');
    });

    newSocket.on('connect_error', (err) => {
      console.error('Socket.IO connection error:', err);
      // Don't stop the app from working when socket fails
    });

    // Listen for new notifications
    newSocket.on('notification', (notification) => {
      setNotifications(prev => [notification, ...prev]);
      setUnreadCount(count => count + 1);
    });

    setSocket(newSocket);

    // Cleanup on unmount
    return () => {
      if (newSocket) {
        newSocket.disconnect();
      }
    };
  }, [currentUser]);

  // Fetch notifications on mount and when user changes
  useEffect(() => {
    if (currentUser) {
      fetchNotifications();
    } else {
      // Clear notifications when user logs out
      setNotifications([]);
      setUnreadCount(0);
    }
  }, [currentUser, fetchNotifications]);

  // Mark notification as read
  const markAsRead = async (notificationId) => {
    try {
      // Import dynamically to prevent circular dependencies  
      const { notificationService } = await import('../services/utils/api');
      
      await notificationService.markNotificationAsRead(notificationId);
      
      // Update local state
      setNotifications(prev => 
        prev.map(n => 
          n.id === notificationId ? { ...n, read: true } : n
        )
      );
      
      // Update unread count
      setUnreadCount(prev => Math.max(0, prev - 1));
      
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  // Mark all notifications as read
  const markAllAsRead = async () => {
    try {
      // Import dynamically to prevent circular dependencies
      const { notificationService } = await import('../services/utils/api');
      
      await notificationService.markAllNotificationsAsRead();
      
      // Update local state
      setNotifications(prev => 
        prev.map(n => ({ ...n, read: true }))
      );
      
      // Reset unread count
      setUnreadCount(0);
      
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  };

  const value = {
    notifications,
    unreadCount,
    error,
    markAsRead,
    markAllAsRead,
    refreshNotifications: fetchNotifications
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export default NotificationContext;