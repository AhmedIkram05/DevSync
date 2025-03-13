const TaskCard = ({ task }) => {
    return (
      <div className="bg-white p-4 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold">{task.title}</h3>
        <p className="text-gray-600">{task.description}</p>
        <div className="mt-2">
          <span className="text-sm text-gray-500">Deadline: {task.deadline}</span>
          <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
            <div
              className="bg-blue-600 h-2 rounded-full"
              style={{ width: `${task.progress}%` }}
            ></div>
          </div>
        </div>
        <button className="mt-2 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
          Update Progress
        </button>
      </div>
    );
  };
  
  export default TaskCard;