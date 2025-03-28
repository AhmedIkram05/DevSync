import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import io from 'socket.io-client';
import { notificationService } from '../services/utils/api';
import { useAuth } from './AuthContext';

const NotificationContext = createContext();

export const useNotifications = () => useContext(NotificationContext);

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [rateLimited, setRateLimited] = useState(false);
  const [serverDown, setServerDown] = useState(false);
  
  const { currentUser } = useAuth();
  
  const socketRef = useRef(null);
  const lastFetchTimeRef = useRef(0);
  const refreshTimeoutRef = useRef(null);
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 5;
  
  // Debounced refresh notifications function with rate limiting
  const refreshNotifications = useCallback(async (force = false) => {
    if (!currentUser || !currentUser.token) {
      return;
    }
    
    // If server is detected as down and not a forced refresh, skip
    if (serverDown && !force) {
      console.log('Skipping notification refresh as server appears to be down');
      return;
    }
    
    // If rate limited and not forced, skip this refresh
    if (rateLimited && !force) {
      console.log('Skipping notification refresh due to rate limiting');
      return;
    }
    
    // Check time since last fetch - enforce minimum 3 second gap between requests
    const now = Date.now();
    const timeSinceLastFetch = now - lastFetchTimeRef.current;
    const minFetchInterval = 3000; // 3 seconds minimum between fetches
    
    // If we fetched recently and this isn't a forced refresh, debounce it
    if (timeSinceLastFetch < minFetchInterval && !force) {
      // Clear any existing timeout
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
      
      // Set a new timeout to fetch after the minimum interval has passed
      refreshTimeoutRef.current = setTimeout(() => {
        refreshNotifications(true); // Force refresh after delay
      }, minFetchInterval - timeSinceLastFetch);
      
      return;
    }
    
    // Clear any existing timeout
    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current);
      refreshTimeoutRef.current = null;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      lastFetchTimeRef.current = now; // Update last fetch time
      
      const data = await notificationService.getNotifications();
      
      // Check if we received a connection error
      if (data && data.isConnectionError) {
        setServerDown(true);
        setError("Server appears to be offline. Notifications will refresh when the connection is restored.");
        return;
      }
      
      // If we got here, the server is up
      setServerDown(false);
      
      // Reset rate limited flag on successful fetch
      if (rateLimited) {
        setRateLimited(false);
      }
      
      if (Array.isArray(data)) {
        setNotifications(data);
      } else if (data && Array.isArray(data.data)) {
        setNotifications(data.data);
      } else {
        console.warn('Unexpected notification data format:', data);
        setNotifications([]);
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
      
      // Detect server connection issues
      if (error.message && (
          error.message.includes('Failed to fetch') || 
          error.message.includes('Network Error') ||
          error.message.includes('server is down')
      )) {
        setServerDown(true);
        setError("Server connection failed. Notifications will refresh when the connection is restored.");
        
        // Schedule a check in 30 seconds to see if server is back up
        refreshTimeoutRef.current = setTimeout(() => {
          console.log('Checking if server is back online...');
          refreshNotifications(true);
        }, 30000);
        
        return;
      }
      
      // Handle rate limiting error specifically
      if (error.status === 429 || (error.message && error.message.includes('429'))) {
        console.warn('Rate limited when fetching notifications. Will try again later.');
        setRateLimited(true);
        
        // Auto retry after a longer delay for rate limit errors
        refreshTimeoutRef.current = setTimeout(() => {
          console.log('Attempting to fetch notifications again after rate limit cooling period');
          refreshNotifications(true);
        }, 30000); // Wait 30 seconds before trying again
      } else {
        setError('Failed to load notifications');
      }
    } finally {
      setIsLoading(false);
    }
  }, [currentUser, rateLimited, serverDown]);
  
  useEffect(() => {
    let socketConnection = null;
    
    const connectSocket = () => {
      if (!currentUser || !currentUser.token) {
        console.log('No user token available for socket connection');
        return;
      }
      
      // Don't try to connect if we know the server is down
      if (serverDown) {
        console.log('Not connecting to WebSocket - server appears to be down');
        return;
      }
      
      // Clean up any existing connection
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
      
      try {
        // Create socket connection with sensible defaults
        const socketUrl = process.env.REACT_APP_API_URL || 'http://localhost:8000';
        socketConnection = io(socketUrl, {
          auth: {
            token: currentUser.token
          },
          transports: ['websocket'],
          reconnection: true,
          reconnectionAttempts: maxReconnectAttempts,
          reconnectionDelay: 1000,
          timeout: 5000 // Shorter timeout to detect connection issues faster
        });
        
        // Store the socket in the ref
        socketRef.current = socketConnection;
        
        // Socket event handlers
        socketConnection.on('connect', () => {
          console.log('Socket.IO connected');
          setIsConnected(true);
          setServerDown(false); // Clear server down flag on successful connection
          reconnectAttemptsRef.current = 0; // Reset reconnect counter
        });
        
        socketConnection.on('disconnect', () => {
          console.log('Socket.IO disconnected');
          setIsConnected(false);
        });
        
        socketConnection.on('connect_error', (error) => {
          console.error('Socket.IO connection error:', error);
          setIsConnected(false);
          
          reconnectAttemptsRef.current++;
          console.log(`Socket connection attempt ${reconnectAttemptsRef.current} of ${maxReconnectAttempts} failed`);
          
          // After max attempts, stop trying and mark server as down
          if (reconnectAttemptsRef.current >= maxReconnectAttempts) {
            console.error('Maximum WebSocket reconnection attempts reached - marking server as down');
            setServerDown(true);
            
            // Close the socket to prevent further automatic reconnect attempts
            if (socketRef.current) {
              socketRef.current.disconnect();
              socketRef.current = null;
            }
            
            // Schedule a retry to check if server is up after a longer delay
            setTimeout(() => {
              console.log('Checking if server is back online...');
              setServerDown(false); // Reset the flag to allow reconnection attempts
              reconnectAttemptsRef.current = 0; // Reset counter
              connectSocket(); // Try to connect again
              refreshNotifications(true); // Also refresh notifications
            }, 60000); // Try again in 1 minute
          }
        });
        
        // Listen for notifications
        socketConnection.on('notification', (newNotification) => {
          console.log('Received new notification:', newNotification);
          setNotifications(prev => [newNotification, ...prev]);
          
          // If browser notifications are supported and permitted, show a browser notification
          if ('Notification' in window && Notification.permission === 'granted') {
            try {
              const notification = new Notification('DevSync Notification', {
                body: newNotification.message,
                icon: '/logo192.png' // Replace with your app's icon
              });
              
              // Open app when notification is clicked
              notification.onclick = function() {
                window.focus();
                notification.close();
              };
            } catch (e) {
              console.error('Error showing browser notification:', e);
            }
          }
        });
      } catch (error) {
        console.error('Error setting up socket connection:', error);
      }
    };
    
    // Only try to connect if we have a user and the server is not known to be down
    if (currentUser && currentUser.token && !serverDown) {
      connectSocket();
      refreshNotifications(true); // Initial fetch with force=true
    }
    
    // Clean up function
    return () => {
      if (socketRef.current) {
        console.log('Cleaning up socket connection');
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
        refreshTimeoutRef.current = null;
      }
    };
  }, [currentUser, refreshNotifications, serverDown]);
  
  // Calculate unread count
  const unreadCount = notifications.filter(notification => !notification.read).length;
  
  // Mark a notification as read
  const markAsRead = async (notificationId) => {
    if (serverDown) {
      console.log('Server appears to be down, cannot mark notification as read');
      return;
    }
    
    try {
      // Optimistic UI update
      setNotifications(notifications.map(notification => 
        notification.id === notificationId 
          ? { ...notification, read: true }
          : notification
      ));
      
      // Make API call
      await notificationService.markAsRead(notificationId);
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
      // Revert the UI change in case of error
      refreshNotifications(true);
    }
  };
  
  // Mark all notifications as read
  const markAllAsRead = async () => {
    if (serverDown) {
      console.log('Server appears to be down, cannot mark all notifications as read');
      return;
    }
    
    try {
      // Update UI immediately for better UX
      setNotifications(notifications.map(notification => ({ ...notification, read: true })));
      
      // API call to mark all as read
      await notificationService.markAllAsRead();
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
      // Revert UI change if the API call failed
      refreshNotifications(true);
    }
  };
  
  // Check if server is back online
  const checkServerStatus = useCallback(() => {
    if (serverDown) {
      console.log('Checking if server is back online...');
      refreshNotifications(true);
    }
  }, [serverDown, refreshNotifications]);
  
  const value = {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    refreshNotifications,
    isConnected,
    isLoading,
    error,
    rateLimited,
    serverDown,
    checkServerStatus
  };
  
  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export default NotificationContext;