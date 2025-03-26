import { Link } from 'react-router-dom';

const GitHubRepoCard = ({ repo }) => {
  // Format date to be more readable
  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown';
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  };

  return (
    <div className="bg-white p-5 rounded-lg shadow hover:shadow-md transition-shadow border border-gray-100">
      <div className="flex justify-between items-start mb-3">
        <h3 className="text-lg font-semibold text-gray-800">{repo.name}</h3>
        <span className="bg-gray-100 px-2 py-1 text-xs rounded text-gray-600">
          {repo.private ? 'Private' : 'Public'}
        </span>
      </div>
      
      <p className="text-gray-600 text-sm mb-4 line-clamp-2 h-10">
        {repo.description || 'No description provided'}
      </p>
      
      <div className="flex flex-wrap mb-4 text-sm">
        {repo.language && (
          <span className="mr-4 flex items-center">
            <span className="h-3 w-3 rounded-full bg-blue-500 mr-1"></span>
            {repo.language}
          </span>
        )}
        
        <span className="mr-4 text-gray-600">
          Updated: {formatDate(repo.updated_at)}
        </span>
      </div>
      
      <div className="flex justify-between mt-2">
        <a 
          href={repo.html_url} 
          target="_blank" 
          rel="noopener noreferrer" 
          className="text-blue-600 hover:text-blue-800 text-sm flex items-center"
        >
          <svg className="h-4 w-4 mr-1" fill="currentColor" viewBox="0 0 24 24">
            <path d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path>
          </svg>
          View on GitHub
        </a>
        
        <Link 
          to={`/githubintegrationdetail/${repo.id}`} 
          className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm"
        >
          View Details
        </Link>
      </div>
    </div>
  );
};

export default GitHubRepoCard;