/**
 * GitHub service for handling OAuth flows without relying on authenticated API requests
 * This service uses direct browser redirects instead of API calls
 */

export const githubService = {
  /**
   * Initiates GitHub OAuth flow by redirecting to a special backend endpoint
   * that will redirect to GitHub's OAuth page
   */
  initiateOAuthFlow: async (userId, token) => {
    // Generate state parameter for security
    const state = btoa(JSON.stringify({
      userId,
      timestamp: Date.now(),
      nonce: Math.random().toString(36).substring(2)
    }));
    
    // Store state in session storage
    sessionStorage.setItem('github_oauth_state', state);
    
    // Instead of hardcoding, get these from environment if available
    const client_id = process.env.REACT_APP_GITHUB_CLIENT_ID || 'Ov23liNLhQnblKq9d1zt';
    
    // CRITICAL: This MUST match exactly what's in GitHub OAuth App settings
    const redirect_uri = encodeURIComponent('http://localhost:8000/api/v1/github/callback');
    
    console.log("Initiating GitHub OAuth with:");
    console.log("- Client ID:", client_id);
    console.log("- Redirect URI:", decodeURIComponent(redirect_uri));
    console.log("- User ID:", userId);
    
    // Create the GitHub OAuth authorization URL directly
    const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${client_id}&redirect_uri=${redirect_uri}&scope=user%20repo&state=${encodeURIComponent(state)}`;
    
    console.log("Full GitHub authorization URL:", githubAuthUrl);
    return githubAuthUrl;
  },
  
  /**
   * Checks if the current URL has GitHub callback parameters
   * Returns parsed results if present
   */
  checkForOAuthCallback: () => {
    const urlParams = new URLSearchParams(window.location.search);
    
    // GitHub OAuth returns a code parameter when successful
    const code = urlParams.get('code');
    const githubSuccess = urlParams.get('github_success');
    
    return {
      success: !!code || githubSuccess === 'true', // Either direct GitHub callback or our backend success redirect
      code: code,
      username: urlParams.get('github_username'),
      userId: urlParams.get('user_id'),
      state: urlParams.get('state'),
      error: urlParams.get('error')
    };
  },
  
  /**
   * Exchange the OAuth code for access token via the backend
   */
  exchangeCodeForToken: async (code, state) => {
    try {
      // Since we can't make the token request directly from the frontend (due to CORS),
      // we'll call our backend API to handle the token exchange
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:8000/api/v1';
      
      console.log(`Exchanging code for token via ${apiUrl}/github/callback`);
      console.log("Code (first few chars):", code.substring(0, 10) + "...");
      console.log("State:", state);
      
      // Using POST request now since we've added POST support to the endpoint
      const response = await fetch(`${apiUrl}/github/callback`, {
        method: 'POST', 
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ code, state })
      });
      
      // Get the full response body regardless of status
      const responseText = await response.text();
      console.log("Response status:", response.status);
      console.log("Response body:", responseText);
      
      // Try to parse the response as JSON
      let responseData;
      try {
        responseData = JSON.parse(responseText);
      } catch (e) {
        console.error("Failed to parse response as JSON:", e);
        throw new Error("Invalid response from server");
      }
      
      if (!response.ok) {
        console.error('Error exchanging GitHub code for token:', responseData);
        throw new Error(responseData.message || responseData.error || 'Failed to exchange GitHub code');
      }
      
      return responseData;
    } catch (error) {
      console.error('Error in exchangeCodeForToken:', error);
      throw error;
    }
  },

  /**
   * Completes the OAuth flow by exchanging the code for an access token
   */
  completeOAuthFlow: async (code) => {
    // Retrieve the state saved during initiateOAuthFlow
    const state = sessionStorage.getItem('github_oauth_state');
    if (!state) {
      throw new Error('Missing OAuth state in session');
    }
    // Exchange the code along with state for an access token via the backend
    return await githubService.exchangeCodeForToken(code, state);
  }
};
