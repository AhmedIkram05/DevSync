import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { githubService } from '../services/github';
import { authApi } from '../services/utils/auth';

const GitHubCallback = () => {
  const [status, setStatus] = useState('Processing GitHub authorization...');
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { updateUser, setError: setAuthError } = useAuth();

  useEffect(() => {
    const handleCallback = async () => {
      // Clear any existing auth errors when this component mounts
      setAuthError(null);
      
      const urlParams = new URLSearchParams(location.search);
      const code = urlParams.get('code');
      const state = urlParams.get('state');
      
      // Check for success parameters from our backend redirect
      const githubSuccess = urlParams.get('github_success');
      const githubUsername = urlParams.get('github_username');
      const userId = urlParams.get('user_id');
      const errorMsg = urlParams.get('error');
      
      // Handle error case first
      if (errorMsg) {
        setError(`GitHub connection error: ${errorMsg}`);
        return;
      }
      
      // If we already received success parameters from our backend redirect
      if (githubSuccess === 'true' && githubUsername && userId) {
        setStatus('GitHub connected successfully!');
        
        // Update the current user with the GitHub info
        const currentUser = authApi.getCurrentUser();
        if (currentUser) {
          const updatedUser = {
            ...currentUser,
            github_connected: true,
            github_username: githubUsername
          };
          
          // Save to localStorage
          localStorage.setItem('user', JSON.stringify(updatedUser));
          
          // Update auth context
          updateUser(updatedUser);
          
          // Redirect to dashboard after a short delay
          setTimeout(() => {
            navigate(currentUser.role === 'admin' ? '/admin' : '/clientdashboard');
          }, 1500);
        } else {
          setError('No user found in session');
        }
        return;
      }

      if (!code) {
        setError('No authorization code received from GitHub');
        return;
      }

      try {
        setStatus('Exchanging code for access token...');
        
        // We need the state but won't use decodedState directly
        if (!state) {
          setError('Missing state parameter');
          return;
        }

        // Exchange the code for an access token via our backend
        const tokenResponse = await githubService.exchangeCodeForToken(code, state);
        
        if (tokenResponse.success) {
          setStatus('GitHub connected successfully!');
          
          // Update the current user with the GitHub info
          const currentUser = authApi.getCurrentUser();
          if (currentUser) {
            const updatedUser = {
              ...currentUser,
              github_connected: true,
              github_username: tokenResponse.github_username || 'GitHub User'
            };
            
            // Save to localStorage
            localStorage.setItem('user', JSON.stringify(updatedUser));
            
            // Update auth context
            updateUser(updatedUser);
            
            // Redirect to dashboard after a short delay
            setTimeout(() => {
              navigate(currentUser.role === 'admin' ? '/admin' : '/clientdashboard');
            }, 1500);
          } else {
            setError('No user found in session');
          }
        } else {
          setError(tokenResponse.message || 'Failed to connect GitHub account');
        }
      } catch (err) {
        console.error('GitHub callback error:', err);
        setError('Error processing GitHub authorization: ' + (err.message || 'Unknown error'));
      }
    };

    handleCallback();
  }, [location.search, navigate, updateUser, setAuthError]);

  return (
    <div className="github-callback">
      <div className="container mt-5">
        <div className="row justify-content-center">
          <div className="col-md-6">
            <div className="card">
              <div className="card-body text-center">
                <h3>GitHub Integration</h3>
                
                {error ? (
                  <div className="alert alert-danger mt-3">
                    <strong>Error:</strong> {error}
                    <div className="mt-3">
                      <button 
                        className="btn btn-primary" 
                        onClick={() => navigate('/clientdashboard')}
                      >
                        Return to Dashboard
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="spinner-border text-primary mt-3" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </div>
                    <p className="mt-3">{status}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GitHubCallback;
