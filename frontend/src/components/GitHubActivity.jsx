import React from 'react';

function GitHubActivity({ activity }) {
  if (!activity?.length) {
    return (
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="text-gray-500 text-center">No recent GitHub activity</div>
      </div>
    );
  }

  return (
    <div className="bg-white p-4 rounded-lg shadow">
      <div className="space-y-2">
        {activity.map((item) => (
          <div 
            key={item.id} 
            className="p-3 bg-gray-50 rounded hover:bg-gray-100"
          >
            <div className="flex items-start justify-between">
              <div>
                {item.type === 'pull_request' && (
                  <span className="text-purple-600 font-medium">
                    PR #{item.number}:
                  </span>
                )}
                {item.type === 'issue' && (
                  <span className="text-blue-600 font-medium">
                    Issue #{item.number}:
                  </span>
                )}
                <span className="ml-2">{item.title}</span>
              </div>
              <div className="text-xs text-gray-500">
                {new Date(item.updated_at).toLocaleDateString()}
              </div>
            </div>
            <div className="mt-1 flex items-center space-x-2">
              <span className={`px-2 py-1 text-xs rounded ${
                item.state === 'open' ? 'bg-green-100 text-green-800' : 
                item.state === 'closed' ? 'bg-red-100 text-red-800' :
                'bg-yellow-100 text-yellow-800'
              }`}>
                {item.state}
              </span>
              {item.repository && (
                <span className="text-xs text-gray-600">
                  {item.repository.name}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default GitHubActivity; 