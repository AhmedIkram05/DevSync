import React from 'react';
import { Link } from 'react-router-dom';

function TaskColumns({ tasks }) {
  // Group tasks by their status
  const todoTasks = tasks?.filter(task => task.status === 'todo' || task.status === 'backlog') || [];
  const inProgressTasks = tasks?.filter(task => task.status === 'in_progress') || [];
  const completedTasks = tasks?.filter(task => task.status === 'completed') || [];

  // Function to display the date in a readable format
  const formatDate = (dateString) => {
    if (!dateString) return 'No date set';
    
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
    } catch (error) {
      return 'Invalid date';
    }
  };

  // Function to determine if a task is overdue
  const isTaskOverdue = (task) => {
    if (!task.deadline) return false;
    
    try {
      const deadline = new Date(task.deadline);
      const today = new Date();
      return deadline < today && task.status !== 'completed';
    } catch (error) {
      return false;
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
      {/* To Do Column */}
      <div className="bg-white p-4 rounded-lg shadow">
        <h3 className="font-semibold mb-4 text-gray-700 flex items-center">
          <span className="w-3 h-3 bg-gray-400 rounded-full mr-2"></span>
          To Do ({todoTasks.length})
        </h3>
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {todoTasks.length > 0 ? todoTasks.map(task => (
            <Link 
              to={`/TaskDetailUser/${task.id}`} 
              key={task.id} 
              className="block p-3 bg-gray-50 rounded hover:bg-gray-100 border-l-4 border-gray-400"
            >
              <h4 className="font-medium">{task.title}</h4>
              <div className="flex justify-between items-center mt-2 text-sm">
                <span className={`${isTaskOverdue(task) ? 'text-red-600 font-semibold' : 'text-gray-600'}`}>
                  Due: {formatDate(task.deadline)}
                </span>
                <span className="px-2 py-1 rounded-full bg-gray-200 text-xs">
                  {task.priority === 'high' ? '❗ High' : 
                   task.priority === 'medium' ? '⚠️ Medium' : '🔽 Low'}
                </span>
              </div>
            </Link>
          )) : (
            <div className="text-center py-6 text-gray-500">No tasks</div>
          )}
        </div>
      </div>
      
      {/* In Progress Column */}
      <div className="bg-white p-4 rounded-lg shadow">
        <h3 className="font-semibold mb-4 text-gray-700 flex items-center">
          <span className="w-3 h-3 bg-yellow-400 rounded-full mr-2"></span>
          In Progress ({inProgressTasks.length})
        </h3>
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {inProgressTasks.length > 0 ? inProgressTasks.map(task => (
            <Link 
              to={`/TaskDetailUser/${task.id}`} 
              key={task.id} 
              className="block p-3 bg-gray-50 rounded hover:bg-gray-100 border-l-4 border-yellow-400"
            >
              <h4 className="font-medium">{task.title}</h4>
              <div className="flex justify-between items-center mt-2 text-sm">
                <span className={`${isTaskOverdue(task) ? 'text-red-600 font-semibold' : 'text-gray-600'}`}>
                  Due: {formatDate(task.deadline)}
                </span>
                <div className="flex items-center">
                  <div className="w-20 bg-gray-200 rounded-full h-2.5 mr-2">
                    <div 
                      className="bg-blue-600 h-2.5 rounded-full" 
                      style={{ width: `${task.progress || 0}%` }}
                    ></div>
                  </div>
                  <span className="text-xs">{task.progress || 0}%</span>
                </div>
              </div>
            </Link>
          )) : (
            <div className="text-center py-6 text-gray-500">No tasks in progress</div>
          )}
        </div>
      </div>
      
      {/* Completed Column */}
      <div className="bg-white p-4 rounded-lg shadow">
        <h3 className="font-semibold mb-4 text-gray-700 flex items-center">
          <span className="w-3 h-3 bg-green-500 rounded-full mr-2"></span>
          Completed ({completedTasks.length})
        </h3>
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {completedTasks.length > 0 ? completedTasks.map(task => (
            <Link 
              to={`/TaskDetailUser/${task.id}`}
              key={task.id} 
              className="block p-3 bg-gray-50 rounded hover:bg-gray-100 border-l-4 border-green-500"
            >
              <h4 className="font-medium text-gray-500">{task.title}</h4>
              <div className="flex justify-between items-center mt-2 text-sm">
                <span className="text-gray-500">
                  Completed: {formatDate(task.completed_date)}
                </span>
                <span className="px-2 py-1 rounded-full bg-green-100 text-green-800 text-xs">
                  ✓ Done
                </span>
              </div>
            </Link>
          )) : (
            <div className="text-center py-6 text-gray-500">No completed tasks</div>
          )}
        </div>
      </div>
    </div>
  );
}

export default TaskColumns;