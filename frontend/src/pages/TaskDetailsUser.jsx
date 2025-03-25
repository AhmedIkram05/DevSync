import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { tasksApi } from '../services/api/tasksApi'; // You'll need to create this API service
import { githubApi } from '../services/api/githubApi';

function TaskDetailsUser() {
  const { id } = useParams();
  const [task, setTask] = useState(null);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [repositories, setRepositories] = useState([]);
  const [selectedRepo, setSelectedRepo] = useState('');
  const [issues, setIssues] = useState([]);
  const [githubLinks, setGithubLinks] = useState([]);

  useEffect(() => {
    const fetchTaskDetails = async () => {
      try {
        setLoading(true);
        const [taskResponse, reposResponse, linksResponse] = await Promise.all([
          tasksApi.getTaskById(id),
          githubApi.getRepositories(),
          githubApi.getTaskGithubLinks(id)
        ]);
        
        setTask(taskResponse.data.task);
        setRepositories(reposResponse.data.repositories || []);
        setGithubLinks(linksResponse.data.links || []);
      } catch (err) {
        setError('Failed to fetch task details');
        console.error('Task details fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchTaskDetails();
  }, [id]);

  const handleProgressUpdate = async (e) => {
    try {
      const updatedProgress = e.target.value;
      await tasksApi.updateTask(id, { progress: updatedProgress });
      setTask(prev => ({ ...prev, progress: updatedProgress }));
    } catch (err) {
      console.error('Failed to update progress:', err);
    }
  };

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    try {
      // Implement comment submission logic here
      // You'll need to create an API endpoint for this
      setComment('');
    } catch (err) {
      console.error('Failed to post comment:', err);
    }
  };

  const handleRepoSelect = async (repoId) => {
    try {
      setSelectedRepo(repoId);
      if (repoId) {
        const response = await githubApi.getRepositoryIssues(repoId);
        setIssues(response.data.issues || []);
      } else {
        setIssues([]);
      }
    } catch (err) {
      console.error('Failed to fetch repository issues:', err);
      setError('Failed to fetch repository issues');
    }
  };

  const handleLinkIssue = async (issueNumber) => {
    try {
      await githubApi.linkTaskWithGithub(id, {
        repo_id: selectedRepo,
        issue_number: issueNumber
      });
      
      // Refresh GitHub links
      const linksResponse = await githubApi.getTaskGithubLinks(id);
      setGithubLinks(linksResponse.data.links || []);
    } catch (err) {
      console.error('Failed to link issue:', err);
      setError('Failed to link GitHub issue');
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div className="text-red-600">{error}</div>;
  if (!task) return <div>Task not found</div>;

  return (
    <div className="container mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h1 className="text-2xl font-bold mb-6">Task Details</h1>
        
        {/* Task Information */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-2">Task Status</h2>
          <div className="bg-gray-100 p-4 rounded">
            <p className="mb-2"><strong>Title:</strong> {task.title}</p>
            <p className="mb-2"><strong>Description:</strong> {task.description}</p>
            <p className="mb-2"><strong>Status:</strong> {task.status}</p>
            <p className="mb-2"><strong>Assignee:</strong> {task.assignee_name}</p>
          </div>
        </div>

        {/* Progress Update */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-2">Update Progress</h2>
          <div className="bg-gray-100 p-4 rounded">
            <input
              type="range"
              min="0"
              max="100"
              value={task.progress || 0}
              onChange={handleProgressUpdate}
              className="w-full"
            />
            <p className="text-center mt-2">{task.progress}% Complete</p>
          </div>
        </div>

        {/* GitHub Issue Link */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-2">Link GitHub Issue</h2>
          <div className="bg-gray-100 p-4 rounded">
            {/* Repository Selection */}
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

            {/* Issue Selection */}
            <select 
              className="w-full p-2 border rounded mt-2"
              disabled={!selectedRepo}
              onChange={(e) => handleLinkIssue(e.target.value)}
            >
              <option value="">Select Issue</option>
              {issues.map((issue) => (
                <option key={issue.id} value={issue.number}>
                  #{issue.number} - {issue.title}
                </option>
              ))}
            </select>

            {/* Display Linked Issues */}
            {githubLinks.length > 0 && (
              <div className="mt-4">
                <h3 className="font-semibold mb-2">Linked Issues:</h3>
                <div className="space-y-2">
                  {githubLinks.map((link) => (
                    <div key={link.id} className="flex items-center justify-between bg-white p-2 rounded">
                      <span>
                        {link.repo_name} #{link.issue_number}
                      </span>
                      <a 
                        href={`https://github.com/${link.repo_name}/issues/${link.issue_number}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800"
                      >
                        View Issue
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Comments Section */}
        <div>
          <h2 className="text-lg font-semibold mb-2">Comments</h2>
          <div className="bg-gray-100 p-4 rounded">
            {/* Display existing comments */}
            <div className="mb-4">
              {task.comments?.map((comment, index) => (
                <div key={index} className="bg-white p-3 rounded mb-2">
                  <p>{comment.text}</p>
                  <small className="text-gray-500">{comment.author} - {comment.date}</small>
                </div>
              ))}
            </div>

            {/* Add new comment */}
            <form onSubmit={handleCommentSubmit}>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="w-full p-2 border rounded"
                placeholder="Add a comment..."
                rows="3"
              />
              <button
                type="submit"
                className="mt-2 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                Post Comment
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TaskDetailsUser;