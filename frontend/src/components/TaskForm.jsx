import { useState } from "react";

const TaskForm = ({ onSubmit, initialData = {}, users = [], projects = [] }) => {
  const [task, setTask] = useState({
    title: initialData.title || "",
    description: initialData.description || "",
<<<<<<< HEAD
    assignedTo: initialData.assigned_to || "",
=======
    assignee: initialData.assigned_to || "",
>>>>>>> 8d205bb3afcd420430ba3421e5cbef67ad7e03d9
    project: initialData.project_id || "",
    deadline: initialData.deadline ? new Date(initialData.deadline).toISOString().split('T')[0] : "",
    status: initialData.status || "todo",
    priority: initialData.priority || "medium"
  });

  const statusOptions = [
    { value: "todo", label: "To Do" },
    { value: "in_progress", label: "In Progress" },
    { value: "review", label: "Review" },
    { value: "backlog", label: "Backlog" }
  ];

  const priorityOptions = [
    { value: "low", label: "Low" },
    { value: "medium", label: "Medium" },
    { value: "high", label: "High" }
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(task);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">Task Title</label>
        <input
          id="title"
          type="text"
          placeholder="Task Title"
          value={task.title}
          onChange={(e) => setTask({ ...task, title: e.target.value })}
          className="w-full p-2 border rounded focus:ring-blue-500 focus:border-blue-500"
          required
        />
      </div>
      
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">Description</label>
        <textarea
          id="description"
          placeholder="Task Description"
          value={task.description}
          onChange={(e) => setTask({ ...task, description: e.target.value })}
          className="w-full p-2 border rounded focus:ring-blue-500 focus:border-blue-500"
          rows={4}
          required
        />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
<<<<<<< HEAD
          <label htmlFor="assignedTo" className="block text-sm font-medium text-gray-700 mb-1">Assignee</label>
          <select
            id="assignedTo"
            value={task.assignedTo}
            onChange={(e) => setTask({ ...task, assignedTo: e.target.value })}
=======
          <label htmlFor="assignee" className="block text-sm font-medium text-gray-700 mb-1">Assignee</label>
          <select
            id="assignee"
            value={task.assignee}
            onChange={(e) => setTask({ ...task, assignee: e.target.value })}
>>>>>>> 8d205bb3afcd420430ba3421e5cbef67ad7e03d9
            className="w-full p-2 border rounded focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Select Assignee</option>
            {users.map(user => (
              <option key={user.id} value={user.id}>
                {user.name || user.email}
              </option>
            ))}
          </select>
        </div>
        
        <div>
          <label htmlFor="project" className="block text-sm font-medium text-gray-700 mb-1">Project</label>
          <select
            id="project"
            value={task.project}
            onChange={(e) => setTask({ ...task, project: e.target.value })}
            className="w-full p-2 border rounded focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Select Project</option>
            {projects.map(project => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">Status</label>
          <select
            id="status"
            value={task.status}
            onChange={(e) => setTask({ ...task, status: e.target.value })}
            className="w-full p-2 border rounded focus:ring-blue-500 focus:border-blue-500"
          >
            {statusOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        
        <div>
          <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
          <select
            id="priority"
            value={task.priority}
            onChange={(e) => setTask({ ...task, priority: e.target.value })}
            className="w-full p-2 border rounded focus:ring-blue-500 focus:border-blue-500"
          >
            {priorityOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        
        <div>
          <label htmlFor="deadline" className="block text-sm font-medium text-gray-700 mb-1">Deadline</label>
          <input
            id="deadline"
            type="date"
            value={task.deadline}
            onChange={(e) => setTask({ ...task, deadline: e.target.value })}
            className="w-full p-2 border rounded focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>
      
      <div className="pt-4 flex justify-end">
        <button
          type="submit"
          className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          {initialData.id ? "Update Task" : "Create Task"}
        </button>
      </div>
    </form>
  );
};

export default TaskForm;