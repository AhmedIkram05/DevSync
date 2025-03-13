import { useState } from "react";
import GitHubRepoCard from "../components/GitHubRepoCard";
import GitHubIssueCard from "../components/GitHubIssueCard";

const GitHubIntegration = () => {
  const [repos, setRepos] = useState([
    { id: 1, name: "DevSync", description: "Project Tracker with GitHub Integration" },
  ]);
  const [issues, setIssues] = useState([
    { id: 1, title: "Fix Login Bug", body: "The login API is not working properly." },
  ]);

  const connectGitHub = async () => {
    // Call backend API to initiate GitHub OAuth flow
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">GitHub Integration</h1>
      <button
        onClick={connectGitHub}
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
      >
        Connect GitHub
      </button>
      <div className="mt-4">
        <h2 className="text-xl font-semibold">Linked Repositories</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-2">
          {repos.map((repo) => (
            <GitHubRepoCard key={repo.id} repo={repo} />
          ))}
        </div>
      </div>
      <div className="mt-4">
        <h2 className="text-xl font-semibold">Linked Issues</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-2">
          {issues.map((issue) => (
            <GitHubIssueCard key={issue.id} issue={issue} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default GitHubIntegration;