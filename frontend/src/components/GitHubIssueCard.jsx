const GitHubIssueCard = ({ issue }) => {
    return (
      <div className="bg-white p-4 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold">{issue.title}</h3>
        <p className="text-gray-600">{issue.body}</p>
        <button className="mt-2 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
          Link Issue
        </button>
      </div>
    );
  };
  
  export default GitHubIssueCard;