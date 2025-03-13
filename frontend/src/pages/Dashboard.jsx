import TaskCard from "../components/TaskCard";

const Dashboard = () => {
  const tasks = [
    { id: 1, title: "Fix API Bug", description: "Resolve authentication issues", deadline: "2025-02-25", progress: 50 },
    { id: 2, title: "Implement OAuth", description: "Integrate GitHub OAuth", deadline: "2025-03-01", progress: 60 },
  ];

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {tasks.map((task) => (
          <TaskCard key={task.id} task={task} />
        ))}
      </div>
    </div>
  );
};

export default Dashboard;