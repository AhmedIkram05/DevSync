import React, { useState, useEffect } from 'react';
import { githubApi } from '../services/api/githubApi'; // You'll need to create this

function GitHubIntegration() {
  const [repositories, setRepositories] = useState([]);
  const [selectedRepo, setSelectedRepo] = useState('');
  const [linkedIssues, setLinkedIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchGitHubData();
  }, []);

  const fetchGitHubData = async () => {
    try {
      setLoading(true);
      const response = await githubApi.getRepositories();
      setRepositories(response.data.repositories);
      setError(null);
    } catch (err) {
      setError('Failed to fetch GitHub data');
      console.error('GitHub data fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleConnectGitHub = async () => {
    try {
      const response = await githubApi.initiateAuth();
      // Redirect to GitHub OAuth flow
      window.location.href = response.data.authorization_url;
    } catch (err) {
      setError('Failed to connect to GitHub');
      console.error('GitHub connection error:', err);
    }
  };

  const handleRepoSelect = async (repoId) => {
    try {
      setSelectedRepo(repoId);
      const response = await githubApi.getRepositoryIssues(repoId);
      setLinkedIssues(response.data.issues);
    } catch (err) {
      setError('Failed to fetch repository issues');
      console.error('Repository issues fetch error:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-100">
     

      {/* Main Content */}
      <div className="flex-1 p-8">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-2xl font-bold mb-6">GitHub Integration</h1>

          {/* GitHub Connect Button */}
          <div className="mb-8">
            <button
              onClick={handleConnectGitHub}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Connect to GitHub
            </button>
          </div>

          {/* Linked Repositories Section */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Linked Repositories</h2>
            <select
              className="w-full p-2 border rounded"
              value={selectedRepo}
              onChange={(e) => handleRepoSelect(e.target.value)}
            >
              <option value="">Select Repository</option>
              {repositories.map((repo) => (
                <option key={repo.id} value={repo.id}>
                  {repo.full_name}
                </option>
              ))}
            </select>
          </div>

          {/* Linked Issues Section */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Linked Issues</h2>
            <select
              className="w-full p-2 border rounded"
              disabled={!selectedRepo}
            >
              <option value="">Select Issue</option>
              {linkedIssues.map((issue) => (
                <option key={issue.id} value={issue.number}>
                  {`#${issue.number} - ${issue.title}`}
                </option>
              ))}
            </select>
            <div className="mt-4 flex justify-end">
              <button
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                disabled={!selectedRepo}
              >
                Link Issue
              </button>
            </div>
          </div>

          {error && (
            <div className="mt-4 text-red-600">
              {error}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default GitHubIntegration;