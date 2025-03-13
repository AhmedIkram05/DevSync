const TaskList = () => {
    const tasks = [
      { id: 1, title: "Fix API Bug", deadline: "2025-02-25", status: "In Progress" },
      { id: 2, title: "Implement OAuth", deadline: "2025-03-01", status: "Completed" },
    ];
  
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Task List</h1>
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-200">
              <th className="p-2 text-left">Task</th>
              <th className="p-2 text-left">Deadline</th>
              <th className="p-2 text-left">Status</th>
              <th className="p-2 text-left">Action</th>
            </tr>
          </thead>
          <tbody>
            {tasks.map((task) => (
              <tr key={task.id} className="border-b">
                <td className="p-2">{task.title}</td>
                <td className="p-2">{task.deadline}</td>
                <td className="p-2">{task.status}</td>
                <td className="p-2">
                  <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
                    Update
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };
  
  export default TaskList;