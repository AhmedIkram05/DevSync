import { useState, useEffect, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { githubService } from "../services/utils/api";
import { authApi } from "../services/utils/auth";
import { useAuth } from "../context/AuthContext";
import GitHubRepoCard from "../components/GitHubRepoCard";
import LoadingSpinner from "../components/LoadingSpinner";

const GitHubIntegration = () => {
  const [connectionStatus, setConnectionStatus] = useState({
    connected: false,
    username: '',
    loading: true,
    error: null
  });
  const [repos, setRepos] = useState([]);
  const [isConnecting, setIsConnecting] = useState(false);
  const [loadingRepos, setLoadingRepos] = useState(false);
  
  const location = useLocation();
  const navigate = useNavigate();
  const { setCurrentUser, setError: setAuthError } = useAuth(); // Remove unused currentUser
  
  useEffect(() => {
    // Clear any auth errors when mounting this component
    setAuthError && setAuthError(null);
  }, [setAuthError]);
  
  // Function to handle the OAuth callback code
  const handleOAuthCallback = useCallback(async (code) => {
    try {
      console.log("Processing GitHub OAuth callback...");
      setIsConnecting(true);
      
      // Send the code to your backend
      await githubService.completeOAuthFlow(code);
      
      // Check the connection status now that we've authorized
      await checkGitHubConnection(true);
      
      // Clean up the URL by removing the code parameter
      navigate('/github', { replace: true });
    } catch (error) {
      console.error("Failed to complete GitHub OAuth flow:", error);
      setConnectionStatus({
        connected: false,
        username: '',
        loading: false,
        error: "Failed to connect GitHub account. Please try again."
      });
    } finally {
      setIsConnecting(false);
    }
  }, [navigate]); // Add dependencies
  
  // Check if we're returning from GitHub OAuth flow with code parameter
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const code = urlParams.get('code');
    const error = urlParams.get('error');
    
    // If there's a code parameter, we're returning from GitHub authorization
    if (code) {
      console.log("GitHub OAuth code detected in URL, handling callback...");
      handleOAuthCallback(code);
    }
    
    // Handle GitHub OAuth errors
    if (error) {
      console.error("GitHub OAuth error:", error);
      setConnectionStatus({
        connected: false,
        username: '',
        loading: false,
        error: "GitHub authentication was denied or failed. Please try again."
      });
    }
  }, [location, handleOAuthCallback]); // Add handleOAuthCallback dependency
  
  // Define checkGitHubConnection with useCallback to fix dependency array issue
  const checkGitHubConnection = useCallback(async (justConnected = false) => {
    try {
      setConnectionStatus(prev => ({ ...prev, loading: true, error: null })); // Clear any previous errors
      
      console.log("Checking GitHub connection status...");
      const data = await githubService.checkConnection();
      console.log("GitHub connection status:", data);
      
      // If we just connected or the status changed, update local storage
      if (justConnected || (data.connected !== connectionStatus.connected)) {
        console.log("Updating GitHub connection status:", data.connected);
        const updatedUser = authApi.updateGitHubStatus(data.connected, data.username);
        if (updatedUser && typeof setCurrentUser === 'function') {
          setCurrentUser(updatedUser);
        }
      }
      
      setConnectionStatus({
        connected: data.connected,
        username: data.username || '',
        loading: false,
        error: null
      });
      
      // If connected, fetch repositories
      if (data.connected) {
        fetchRepositories();
      }
    } catch (error) {
      console.error("GitHub connection check error:", error);
      setConnectionStatus({
        connected: false,
        username: '',
        loading: false,
        error: "Failed to check GitHub connection. Please try again."
      });
    }
  }, [connectionStatus.connected, setCurrentUser]);
  
  // Check connection status on component mount
  useEffect(() => {
    console.log("GitHubIntegration component mounted, checking connection status");
    checkGitHubConnection();
  }, [checkGitHubConnection]);
  
  const fetchRepositories = async () => {
    try {
      setLoadingRepos(true);
      console.log("Fetching GitHub repositories...");
      const data = await githubService.getUserRepos();
      console.log("GitHub repositories received:", data);
      
      // Check if the response contains a repositories property
      const repos = data.repositories || data || [];
      setRepos(repos);
    } catch (error) {
      console.error("Failed to fetch repositories:", error);
    } finally {
      setLoadingRepos(false);
    }
  };
  
  const connectGitHub = async () => {
    try {
      setIsConnecting(true);
      console.log("Initiating GitHub OAuth flow...");
      
      // Get the OAuth URL from your backend
      const oauthUrl = await githubService.initiateOAuthFlow();
      console.log("Received GitHub OAuth URL:", oauthUrl);
      
      if (!oauthUrl) {
        throw new Error("No GitHub authorization URL received from server");
      }
      
      // Redirect user to GitHub for authorization
      console.log("Redirecting to GitHub authorization page...");
      window.location.href = oauthUrl;
    } catch (error) {
      console.error("GitHub connection error:", error);
      setIsConnecting(false);
      setConnectionStatus(prev => ({
        ...prev,
        error: "Failed to connect to GitHub. Please try again."
      }));
    }
  };
  
  const disconnectGitHub = async () => {
    const confirmed = window.confirm("Are you sure you want to disconnect your GitHub account? This will remove all repository links.");
    
    if (confirmed) {
      try {
        console.log("Disconnecting GitHub account...");
        await githubService.disconnectAccount();
        
        // Update local storage
        const updatedUser = authApi.updateGitHubStatus(false, '');
        if (updatedUser && typeof setCurrentUser === 'function') {
          setCurrentUser(updatedUser);
        }
        
        setConnectionStatus({
          connected: false,
          username: '',
          loading: false,
          error: null
        });
        
        setRepos([]);
        console.log("GitHub account disconnected successfully");
      } catch (error) {
        console.error("GitHub disconnect error:", error);
        setConnectionStatus(prev => ({
          ...prev,
          error: "Failed to disconnect from GitHub. Please try again."
        }));
      }
    }
  };
  
  if (connectionStatus.loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }
  
  return (
    <div className="container mx-auto p-4 md:p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-4">GitHub Integration</h1>
        
        {connectionStatus.error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {connectionStatus.error}
          </div>
        )}
        
        {!connectionStatus.connected ? (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-semibold mb-3">Connect Your GitHub Account</h2>
            <p className="mb-4 text-gray-600">
              Connect your GitHub account to link tasks with repositories and issues. 
              This integration allows you to:
            </p>
            <ul className="list-disc pl-5 mb-6 text-gray-600">
              <li className="mb-1">View your GitHub repositories and issues within DevSync</li>
              <li className="mb-1">Link tasks to specific GitHub issues</li>
              <li className="mb-1">Track GitHub activity related to your tasks</li>
            </ul>
            <button
              onClick={connectGitHub}
              disabled={isConnecting}
              className={`flex items-center bg-gray-800 text-white px-6 py-3 rounded hover:bg-gray-700 ${
                isConnecting ? 'opacity-70 cursor-not-allowed' : ''
              }`}
            >
              {isConnecting ? (
                <>
                  <svg className="animate-spin h-5 w-5 mr-3" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Connecting...
                </>
              ) : (
                <>
                  <svg className="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                    <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                  </svg>
                  Connect with GitHub
                </>
              )}
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow mb-8">
            <div className="p-6 border-b">
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <svg className="h-8 w-8 mr-3 text-gray-800" fill="currentColor" viewBox="0 0 24 24">
                    <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <h2 className="text-xl font-semibold">GitHub Account Connected</h2>
                    <p className="text-gray-600">Connected as: {connectionStatus.username}</p>
                  </div>
                </div>
                <button 
                  onClick={disconnectGitHub}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded"
                >
                  Disconnect
                </button>
              </div>
            </div>
            
            {/* GitHub Repositories Section */}
            <div className="p-6">
              <h3 className="text-lg font-medium mb-4">Your Repositories</h3>
              {loadingRepos ? (
                <div className="flex justify-center py-10">
                  <LoadingSpinner />
                </div>
              ) : repos.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {repos.map((repo) => (
                    <GitHubRepoCard key={repo.id} repo={repo} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-10 text-gray-500">
                  No repositories found. Make sure you have repositories in your GitHub account.
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GitHubIntegration;