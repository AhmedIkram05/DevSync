import { createContext, useState, useContext, useEffect, useRef } from 'react';
import { authApi } from '../services/utils/auth';
// Using our custom githubService instead of the one from api
import { githubService } from '../services/github';
import { useNavigate, useLocation } from 'react-router-dom';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  // Try to load user immediately during component initialization to prevent flicker
  const initialUser = (() => {
    try {
      const userJson = localStorage.getItem('user');
      if (userJson) {
        const userData = JSON.parse(userJson);
        if (userData && userData.id && userData.token) {
          console.log("Initialized user from localStorage during initial render");
          return userData;
        }
      }
    } catch (e) {
      console.error("Error initializing user from localStorage:", e);
    }
    return null;
  })();

  // State management
  const [currentUser, setCurrentUser] = useState(initialUser);
  const [loading, setLoading] = useState(!initialUser);
  const [error, setError] = useState(null);
  const [githubConnected, setGithubConnected] = useState(initialUser?.github_connected || false);
  const [showGithubPrompt, setShowGithubPrompt] = useState(false);
  
  // Keep a ref to track initialization
  const isInitialized = useRef(false);
  
  const navigate = useNavigate();
  const location = useLocation();
  
  // Function to verify token - FIXED to be more resilient
  const verifyToken = (user) => {
    if (!user) {
      console.log("No user found in localStorage");
      return false;
    }
    
    if (!user.token) {
      console.log("User found in localStorage but missing token:", user);
      return false; // Don't create temporary tokens, they won't work
    }
    
    return true;
  };
  
  // Load the user from localStorage on component mount - FIXED
  useEffect(() => {
    // Skip if we already have a user from initialization
    if (initialUser || isInitialized.current) {
      isInitialized.current = true;
      return;
    }
    
    const loadUser = () => {
      try {
        console.log("Initializing authentication context...");
        // Get user from localStorage
        const user = authApi.getCurrentUser();
        console.log("Auth initial load - user from localStorage:", user ? "Found" : "Not found");
        
        if (user) {
          // User exists in localStorage
          if (verifyToken(user)) {
            console.log("Setting authenticated user:", 
                       user.email, 
                       "Token:", user.token ? "Present" : "Missing");
            
            // Update the state with the user
            setCurrentUser(user);
            
            // Set GitHub connection status if available
            if ('github_connected' in user) {
              setGithubConnected(user.github_connected);
              
              // Check if we should show the GitHub prompt
              if (!user.github_connected) {
                console.log("User not connected to GitHub, will show prompt");
                setShowGithubPrompt(true);
              }
            }
          } else {
            console.log("Invalid user data, clearing localStorage");
            // If verification fails, clear the user and redirect to login
            localStorage.removeItem('user');
            navigate('/login', { replace: true });
          }
        } else {
          console.log("No user found in localStorage");
        }
      } catch (err) {
        console.error("Error loading user from localStorage:", err);
        localStorage.removeItem('user');
      } finally {
        setLoading(false);
        isInitialized.current = true;
      }
    };
    
    loadUser();
  }, [initialUser, navigate]); // Add navigate as dependency
  
  // Function to connect GitHub account
  const connectGitHub = async () => {
    try {
      setError(null); // Clear previous errors
      console.log("Initiating GitHub connection...");
      setLoading(true);
      
      // Get current user directly from localStorage to ensure most up-to-date data
      const user = authApi.getCurrentUser();
      
      if (!user) {
        console.error("No user found for GitHub connection");
        setError("Authentication required. Please log in again before connecting GitHub.");
        navigate('/login');
        return;
      }
      
      console.log("Attempting GitHub connection...");
      
      // Use the githubService to get the OAuth URL
      const oauthUrl = await githubService.initiateOAuthFlow(user.id, user.token);
      
      console.log("Redirecting to GitHub authorization URL:", oauthUrl);
      window.location.href = oauthUrl;
    } catch (error) {
      console.error("GitHub connection error:", error);
      setError("Failed to connect to GitHub. Please try again.");
    } finally {
      setLoading(false);
    }
  };
  
  const login = async (credentials) => {
    try {
      setError(null);
      setLoading(true);
      
      console.log("Attempting login with credentials:", credentials.email);
      
      // Call login API
      const data = await authApi.login(credentials);
      
      // Log complete response for debugging
      console.log("Login API response received");
      
      // Extract token with fallbacks
      let token = null;
      
      // Option 1: Check if token is in user object
      if (data.user && data.user.token) {
        token = data.user.token;
      } 
      // Option 2: Check if token is at the root level of the response
      else if (data.token) {
        token = data.token;
      }
      
      if (data.user) {
        // Store the user with the token in state and localStorage
        const userWithToken = {
          ...data.user,
          token: token || '',  // Don't generate temp tokens as they're not accepted by the backend
          github_connected: data.user.github_connected || false,
          github_username: data.user.github_username || '',
          // Make sure role is explicitly set
          role: data.user.role || (data.user.is_admin ? 'admin' : 'client')
        };
        
        console.log("Login successful, saving user with token");
        console.log("User role:", userWithToken.role);
        
        // Save to localStorage first to ensure persistence
        localStorage.setItem('user', JSON.stringify(userWithToken));
        
        // Verify it was saved correctly by reading it back
        const savedUser = JSON.parse(localStorage.getItem('user'));
        console.log("Verified user saved to localStorage:", 
                   savedUser ? "Success" : "Failed",
                   "Token present:", savedUser && savedUser.token ? "Yes" : "No");
        
        // Update state
        setCurrentUser(userWithToken);
        
        // Set GitHub connection status
        const isGithubConnected = userWithToken.github_connected || false;
        setGithubConnected(isGithubConnected);
        
        // If user is not connected to GitHub, show the prompt after redirection
        if (!isGithubConnected) {
          // Set a timeout to show GitHub prompt shortly after navigating to dashboard
          setTimeout(() => {
            setShowGithubPrompt(true);
          }, 500); // Show after a slight delay to let the dashboard render
        }
        
        // Use setTimeout to ensure state is updated before navigation
        setTimeout(() => {
          // Navigate to the appropriate dashboard with state to prevent loops
          const redirectPath = location.state?.from || 
            (userWithToken.role === 'admin' ? '/admin' : '/clientdashboard');
            
          console.log(`Redirecting to ${redirectPath} after successful login`);
          console.log("User object being saved:", userWithToken);
          navigate(redirectPath, { replace: true });
        }, 100);
        
        return data;
      } else {
        // No user data found - this is an error
        console.error("Failed to extract user data from login response");
        throw new Error('No user data received. Please try again.');
      }
    } catch (err) {
      console.error("Login error:", err);
      setError(err.message || 'Login failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };
  
  const handleGithubPromptResponse = (connect) => {
    setShowGithubPrompt(false);
    
    if (connect) {
      // User wants to connect GitHub now
      connectGitHub();
    }
    // No need for else block since we've already navigated to the dashboard
  };
  
  const register = async (userData) => {
    try {
      setError(null);
      const data = await authApi.register(userData);
      
      // Don't set current user on registration - just redirect to login
      navigate('/login');
      return data;
    } catch (err) {
      console.error("Registration error:", err);
      setError(err.message || 'Registration failed');
      throw err;
    }
  };
  
  const logout = async () => {
    try {
      await authApi.logout();
      localStorage.removeItem('user');
      setCurrentUser(null);
      setGithubConnected(false);
      setShowGithubPrompt(false);
      navigate('/login', { replace: true });
    } catch (err) {
      console.error("Logout error:", err);
      // Still clear the user from context even if the API call fails
      localStorage.removeItem('user');
      setCurrentUser(null);
      setGithubConnected(false);
      setShowGithubPrompt(false);
      navigate('/login', { replace: true });
    }
  };
  
  // Function to update current user (used after GitHub connection)
  const updateUser = (userData) => {
    if (!userData) {
      console.warn("Attempted to update user with null/undefined data");
      return;
    }
    
    // Update local state
    setCurrentUser(prevUser => {
      if (!prevUser) return userData;
      
      // Ensure token is preserved when updating user data
      const updated = {
        ...prevUser,
        ...userData,
        // Only use userData.token if it exists and is not empty
        token: (userData.token && userData.token.trim()) ? userData.token : prevUser.token
      };
      
      // Also update localStorage
      localStorage.setItem('user', JSON.stringify(updated));
      console.log("Updated user in localStorage and state:", updated.email);
      
      return updated;
    });
    
    // Update GitHub connection status if that information is included
    if (userData && 'github_connected' in userData) {
      setGithubConnected(userData.github_connected);
      if (userData.github_connected) {
        // If GitHub is now connected, make sure to hide the prompt
        setShowGithubPrompt(false);
      }
    }
  };
  
  // Also provide a method to check if the user is returning from GitHub OAuth
  useEffect(() => {
    // Check if we're returning from a GitHub OAuth flow
    const oauthResult = githubService.checkForOAuthCallback();
    
    if (oauthResult.success && oauthResult.username && oauthResult.userId) {
      console.log("Detected GitHub OAuth callback with success");
      
      // Update the user in localStorage with GitHub connection status
      const user = authApi.getCurrentUser();
      if (user && user.id.toString() === oauthResult.userId.toString()) {
        // Update the user object with GitHub connection info
        user.github_connected = true;
        user.github_username = oauthResult.username;
        
        // Save back to localStorage
        localStorage.setItem('user', JSON.stringify(user));
        
        // Update context state
        updateUser(user);
        
        // Set GitHub connected flag
        setGithubConnected(true);
        setShowGithubPrompt(false);
        
        // Remove GitHub OAuth parameters from URL to prevent duplicate processing
        navigate(location.pathname, { replace: true });
      }
    }
  }, [location.pathname, location.search, navigate]); // Add navigate as dependency
  
  // Update the OAuth callback effect to better handle GitHub's response pattern
  useEffect(() => {
    // Check for specific GitHub OAuth code parameter which indicates a callback from GitHub
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const state = urlParams.get('state');
    
    // If we have a code and state, this is a direct callback from GitHub OAuth
    if (code && state && location.pathname.includes('/github/')) {
      console.log("Detected GitHub OAuth callback with code on path:", location.pathname);
      
      // Extract the state to get back the userId we stored
      let decodedState;
      try {
        decodedState = JSON.parse(atob(state));
      } catch (error) {
        console.error("Failed to decode state:", error);
        return;
      }
      
      const { userId } = decodedState;
      
      // Get the current user
      const user = authApi.getCurrentUser();
      
      // Verify the user matches the one who initiated the flow
      if (user && user.id.toString() === userId.toString()) {
        // Clear previous errors
        setError(null);
        
        // Let the user know we're processing
        console.log("GitHub connection is being processed...");
        
        // After a short delay, check if the user is now connected
        setTimeout(() => {
          // Refresh the user data from the server or localStorage
          const refreshedUser = authApi.getCurrentUser();
          if (refreshedUser && refreshedUser.github_connected) {
            updateUser(refreshedUser);
            setGithubConnected(true);
            setShowGithubPrompt(false);
            setError(null);
          }
          
          // Clean up the URL by removing the OAuth code params
          navigate(location.pathname.split('?')[0], { replace: true });
        }, 3000);
      }
    }
    
    // Also check for our custom success parameters from the backend
    const githubSuccess = urlParams.get('github_success');
    const githubUsername = urlParams.get('github_username');
    const userId = urlParams.get('user_id');
    
    if (githubSuccess === 'true' && githubUsername && userId) {
      console.log("Detected GitHub OAuth callback with success parameters");
      setError(null); // Clear any errors
      
      // Update the user in localStorage with GitHub connection status
      const user = authApi.getCurrentUser();
      if (user && user.id.toString() === userId.toString()) {
        // Update the user object with GitHub connection info
        user.github_connected = true;
        user.github_username = githubUsername;
        
        // Save back to localStorage
        localStorage.setItem('user', JSON.stringify(user));
        
        // Update context state
        updateUser(user);
        
        // Set GitHub connected flag
        setGithubConnected(true);
        setShowGithubPrompt(false);
        
        // Remove GitHub OAuth parameters from URL to prevent duplicate processing
        navigate(location.pathname.split('?')[0], { replace: true });
      }
    }
    
    // Check for error parameter
    const errorMsg = urlParams.get('error');
    if (errorMsg) {
      setError(`GitHub connection error: ${errorMsg}`);
    }
  }, [location.pathname, location.search, navigate]);

  const value = {
    currentUser,
    setCurrentUser: updateUser,
    login,
    register,
    logout,
    loading,
    error,
    setError, // Expose setError for external components to use
    githubConnected,
    connectGitHub,
    showGithubPrompt,
    handleGithubPromptResponse,
    setShowGithubPrompt
  };
  
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};