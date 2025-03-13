import TaskForm from "../components/TaskForm";

const TaskCreation = () => {
  const handleSubmit = (task) => {
    // Call backend API to create task
    console.log("Task created:", task);
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Create Task</h1>
      <TaskForm onSubmit={handleSubmit} />
    </div>
  );
};

export default TaskCreation;