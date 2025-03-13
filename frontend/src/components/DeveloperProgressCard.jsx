const DeveloperProgressCard = ({ developer }) => {
    return (
      <div className="bg-white p-4 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold">{developer.name}</h3>
        <p className="text-gray-600">Completed Tasks: {developer.completedTasks}</p>
        <p className="text-gray-600">Pending Tasks: {developer.pendingTasks}</p>
      </div>
    );
  };
  
  export default DeveloperProgressCard;