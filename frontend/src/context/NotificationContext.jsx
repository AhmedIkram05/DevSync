import React, { createContext, useContext, useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { notificationService } from '../services/utils/api';

const NotificationContext = createContext();

export const useNotification = () => useContext(NotificationContext);

export const NotificationProvider = ({ children }) => {
  const { currentUser } = useAuth();
  const [socket, setSocket] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isConnected, setIsConnected] = useState(false);

  // Initialize Socket.IO connection when user is authenticated
  useEffect(() => {
    let socketInstance = null;

    const connectSocket = () => {
      if (!currentUser?.id) return;

      // Create Socket.IO connection - Updated to use port 8000
      socketInstance = io('http://127.0.0.1:8000', {
        withCredentials: true,
        query: {
          token: currentUser.token
        }
      });

      // Socket connection events
      socketInstance.on('connect', () => {
        console.log('Socket.IO connected');
        setIsConnected(true);
        
        // Register user with their ID
        socketInstance.emit('register', { user_id: currentUser.id });
        
        // If user has projects, join their rooms
        if (currentUser.projects) {
          currentUser.projects.forEach(projectId => {
            socketInstance.emit('join_project', { project_id: projectId });
          });
        }
      });

      socketInstance.on('disconnect', () => {
        console.log('Socket.IO disconnected');
        setIsConnected(false);
      });

      socketInstance.on('connect_error', (err) => {
        console.error('Socket.IO connection error:', err);
        setIsConnected(false);
      });

      // Listen for notification events
      socketInstance.on('notification', (data) => {
        console.log('New notification received:', data);
        setNotifications(prev => [data, ...prev]);
        setUnreadCount(count => count + 1);
        
        // Show browser notification if supported
        showBrowserNotification(data);
      });

      setSocket(socketInstance);
    };

    // Fetch initial notifications
    const fetchNotifications = async () => {
      if (!currentUser) return;
      
      try {
        const fetchedNotifications = await notificationService.getNotifications();
        setNotifications(fetchedNotifications || []);
        setUnreadCount(
          fetchedNotifications?.filter(notification => !notification.is_read)?.length || 0
        );
      } catch (error) {
        console.error('Failed to fetch notifications:', error);
      }
    };

    if (currentUser) {
      connectSocket();
      fetchNotifications();
    }

    // Cleanup on unmount
    return () => {
      if (socketInstance) {
        socketInstance.disconnect();
      }
    };
  }, [currentUser]);

  // Show browser notification if permission is granted
  const showBrowserNotification = (notification) => {
    if (!('Notification' in window)) return;
    
    if (Notification.permission === 'granted') {
      new Notification('DevSync Notification', {
        body: notification.content,
        icon: '/logo.png' // Ensure you have this icon in your public folder
      });
    } else if (Notification.permission !== 'denied') {
      Notification.requestPermission();
    }
  };

  // Mark a notification as read
  const markAsRead = async (notificationId) => {
    try {
      await notificationService.markAsRead(notificationId);
      
      // Update local state
      setNotifications(prev => 
        prev.map(notification => 
          notification.id === notificationId 
            ? { ...notification, is_read: true } 
            : notification
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
      const unreadNotifications = notifications.filter(n => !n.is_read);
      
      if (unreadNotifications.length === 0) return;
      
      // Update all unread notifications
      await Promise.all(
        unreadNotifications.map(n => notificationService.markAsRead(n.id))
      );
      
      // Update local state
      setNotifications(prev => 
        prev.map(notification => ({ ...notification, is_read: true }))
      );
      
      // Reset unread count
      setUnreadCount(0);
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  };

  // Refresh notifications from server
  const refreshNotifications = async () => {
    try {
      const fetchedNotifications = await notificationService.getNotifications();
      setNotifications(fetchedNotifications || []);
      setUnreadCount(
        fetchedNotifications?.filter(notification => !notification.is_read)?.length || 0
      );
    } catch (error) {
      console.error('Failed to refresh notifications:', error);
    }
  };

  const value = {
    socket,
    notifications,
    unreadCount,
    isConnected,
    markAsRead,
    markAllAsRead,
    refreshNotifications
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export default NotificationContext;