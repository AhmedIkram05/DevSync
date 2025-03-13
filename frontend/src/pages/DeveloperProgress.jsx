import DeveloperProgressCard from "../components/DeveloperProgressCard";

const DeveloperProgress = () => {
  const developers = [
    { id: 1, name: "John Doe", completedTasks: 5, pendingTasks: 2 },
    { id: 2, name: "Jane Smith", completedTasks: 7, pendingTasks: 1 },
  ];

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Developer Progress</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {developers.map((developer) => (
          <DeveloperProgressCard key={developer.id} developer={developer} />
        ))}
      </div>
    </div>
  );
};

export default DeveloperProgress;