const AdminDashboard = () => {
    const tasks = [
      { id: 1, title: "Fix API Bug", status: "In Progress", assignee: "John Doe" },
      { id: 2, title: "Implement OAuth", status: "Completed", assignee: "Jane Smith" },
    ];
  
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Admin Dashboard</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tasks.map((task) => (
            <div key={task.id} className="bg-white p-4 rounded-lg shadow-md">
              <h3 className="text-lg font-semibold">{task.title}</h3>
              <p className="text-gray-600">Assignee: {task.assignee}</p>
              <p className="text-gray-600">Status: {task.status}</p>
            </div>
          ))}
        </div>
      </div>
    );
  };
  
  export default AdminDashboard;