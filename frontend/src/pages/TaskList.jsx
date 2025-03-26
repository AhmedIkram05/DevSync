import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { tasksApi } from '../services/api/tasksApi';
// const tasks = [
//   { id: 1, title: "Fix API Bug", deadline: "2025-02-25", status: "In Progress" },
//   { id: 2, title: "Implement OAuth", deadline: "2025-03-01", status: "Completed" },
// ];

// return (
//   <div className="p-6">
//     <h1 className="text-2xl font-bold mb-4">Task List</h1>
//     <table className="w-full border-collapse">
//       <thead>
//         <tr className="bg-gray-200">
//           <th className="p-2 text-left">Task</th>
//           <th className="p-2 text-left">Deadline</th>
//           <th className="p-2 text-left">Status</th>
//           <th className="p-2 text-left">Action</th>
//         </tr>
//       </thead>
//       <tbody>
//         {tasks.map((task) => (
//           <tr key={task.id} className="border-b">
//             <td className="p-2">{task.title}</td>
//             <td className="p-2">{task.deadline}</td>
//             <td className="p-2">{task.status}</td>
//             <td className="p-2">
//               <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
//                 Update
//               </button>
//             </td>
//           </tr>
//         ))}
//       </tbody>
//     </table>
//   </div>
// );
// };


const TaskList = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // Fetch tasks when component mounts
  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const response = await tasksApi.getAllTasks();
      setTasks(response.data.tasks);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch tasks:', err);
      setError('Failed to load tasks. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (taskId, newStatus) => {
    try {
      await tasksApi.updateTask(taskId, { status: newStatus });
      // Refresh tasks after update
      fetchTasks();
    } catch (err) {
      console.error('Failed to update task:', err);
      setError('Failed to update task status.');
    }
  };

  const handleViewDetails = (taskId) => {
    navigate(`/TaskDetailUser/${taskId}`);
  };

  // Format date to be more readable
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Get status badge color
  const getStatusBadgeClass = (status) => {
    const statusClasses = {
      todo: 'bg-gray-200 text-gray-800',
      in_progress: 'bg-blue-200 text-blue-800',
      review: 'bg-yellow-200 text-yellow-800',
      done: 'bg-green-200 text-green-800'
    };
    return statusClasses[status] || 'bg-gray-200 text-gray-800';
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-xl">Loading tasks...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Task List</h1>
        <div className="flex gap-4">
          <button 
            onClick={() => fetchTasks()} 
            className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
          >
            Refresh
          </button>
        </div>
      </div>

      {tasks.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No tasks found.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse bg-white shadow-sm rounded-lg">
            <thead>
              <tr className="bg-gray-50">
                <th className="p-4 text-left font-semibold text-gray-600">Title</th>
                <th className="p-4 text-left font-semibold text-gray-600">Description</th>
                <th className="p-4 text-left font-semibold text-gray-600">Deadline</th>
                <th className="p-4 text-left font-semibold text-gray-600">Status</th>
                <th className="p-4 text-left font-semibold text-gray-600">Progress</th>
                <th className="p-4 text-left font-semibold text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {tasks.map((task) => (
                <tr key={task.id} className="border-t hover:bg-gray-50">
                  <td className="p-4">{task.title}</td>
                  <td className="p-4">{task.description}</td>
                  <td className="p-4">
                    {task.deadline ? formatDate(task.deadline) : 'No deadline'}
                  </td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded-full text-sm ${getStatusBadgeClass(task.status)}`}>
                      {task.status}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div 
                        className="bg-blue-600 h-2.5 rounded-full" 
                        style={{ width: `${task.progress || 0}%` }}
                      ></div>
                    </div>
                    <span className="text-sm text-gray-600">{task.progress || 0}%</span>
                  </td>
                  <td className="p-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleViewDetails(task.id)}
                        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                      >
                        View Details
                      </button>
                      <select
                        value={task.status}
                        onChange={(e) => handleUpdateStatus(task.id, e.target.value)}
                        className="border rounded px-2 py-2"
                      >
                        <option value="todo">Todo</option>
                        <option value="in_progress">In Progress</option>
                        <option value="review">Review</option>
                        <option value="done">Done</option>
                      </select>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default TaskList;