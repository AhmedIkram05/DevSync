import React from 'react';

const GitHubIssueCard = ({ issue, onLinkClick, linkedTaskId, isLinking = false }) => {
  // Format date to be more readable
  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown';
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  };

  // Determine issue status based on GitHub issue state and labels
  const getIssueStatus = () => {
    if (issue.state === 'closed') {
      return { text: 'Closed', className: 'bg-gray-100 text-gray-800' };
    }
    
    // Check for common status labels
    const labels = issue.labels || [];
    for (const label of labels) {
      const labelName = (label.name || '').toLowerCase();
      
      if (labelName.includes('bug')) {
        return { text: 'Bug', className: 'bg-red-100 text-red-800' };
      } else if (labelName.includes('feature')) {
        return { text: 'Feature', className: 'bg-green-100 text-green-800' };
      } else if (labelName.includes('enhancement')) {
        return { text: 'Enhancement', className: 'bg-blue-100 text-blue-800' };
      } else if (labelName.includes('help')) {
        return { text: 'Help Wanted', className: 'bg-purple-100 text-purple-800' };
      }
    }
    
    return { text: 'Open', className: 'bg-yellow-100 text-yellow-800' };
  };
  
  const issueStatus = getIssueStatus();

  return (
    <div className="bg-white border rounded-lg hover:shadow-md transition-shadow p-4">
      <div className="flex justify-between">
        <div>
          <div className="flex items-center mb-2">
            <svg className="h-4 w-4 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            <h3 className="font-medium">
              <a 
                href={issue.html_url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800"
              >
                #{issue.number} {issue.title}
              </a>
            </h3>
          </div>
          <p className="text-sm text-gray-500 mb-2">
            Opened by <span className="font-medium">{issue.user?.login || 'Unknown'}</span> on {formatDate(issue.created_at)}
          </p>
        </div>
        <span className={`px-2 py-1 h-6 rounded-full text-xs ${issueStatus.className}`}>
          {issueStatus.text}
        </span>
      </div>
      
      {issue.body && (
        <div className="text-sm text-gray-600 mt-3 mb-3 line-clamp-2">
          {issue.body}
        </div>
      )}
      
      <div className="flex justify-between items-center mt-4">
        <div className="flex space-x-1">
          {issue.labels?.slice(0, 3).map(label => (
            <span 
              key={label.id || label.name} 
              className="px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800"
              title={label.description || label.name}
            >
              {label.name}
            </span>
          ))}
          {(issue.labels?.length > 3) && (
            <span className="px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-800">
              +{issue.labels.length - 3} more
            </span>
          )}
        </div>
        
        {onLinkClick && !linkedTaskId && (
          <button
            onClick={() => onLinkClick(issue.id)}
            disabled={isLinking}
            className={`px-3 py-1 rounded text-sm ${
              isLinking ? 'bg-gray-300 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            {isLinking ? 'Linking...' : 'Link Issue'}
          </button>
        )}
        
        {linkedTaskId && (
          <div className="text-sm text-green-600 flex items-center">
            <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
            </svg>
            Linked to Task #{linkedTaskId}
          </div>
        )}
      </div>
    </div>
  );
};

export default GitHubIssueCard;