import { useState } from "react";

const TaskForm = ({ onSubmit, initialData = {} }) => {
  const [task, setTask] = useState({
    title: initialData.title || "",
    description: initialData.description || "",
    assignee: initialData.assignee || "",
    deadline: initialData.deadline || "",
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(task);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <input
        type="text"
        placeholder="Task Title"
        value={task.title}
        onChange={(e) => setTask({ ...task, title: e.target.value })}
        className="w-full p-2 border rounded"
      />
      <textarea
        placeholder="Task Description"
        value={task.description}
        onChange={(e) => setTask({ ...task, description: e.target.value })}
        className="w-full p-2 border rounded"
      />
      <input
        type="text"
        placeholder="Assignee"
        value={task.assignee}
        onChange={(e) => setTask({ ...task, assignee: e.target.value })}
        className="w-full p-2 border rounded"
      />
      <input
        type="date"
        value={task.deadline}
        onChange={(e) => setTask({ ...task, deadline: e.target.value })}
        className="w-full p-2 border rounded"
      />
      <button
        type="submit"
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
      >
        {initialData.id ? "Update Task" : "Create Task"}
      </button>
    </form>
  );
};

export default TaskForm;