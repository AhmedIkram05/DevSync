import React from 'react';

function TaskColumns({ tasks }) {
  const todoTasks = tasks?.due_soon?.filter(task => task.status === 'todo') || [];
  const inProgressTasks = tasks?.due_soon?.filter(task => task.status === 'in_progress') || [];
  const completedTasks = tasks?.recently_completed || [];

  return (
    <div className="grid grid-cols-3 gap-6">
      {/* To Do Column */}
      <div className="bg-white p-4 rounded-lg shadow">
        <h3 className="font-semibold mb-4">To Do</h3>
        <div className="space-y-2">
          {todoTasks.map(task => (
            <div key={task.id} className="p-3 bg-gray-50 rounded hover:bg-gray-100">
              <h4 className="font-medium">{task.title}</h4>
              <p className="text-sm text-gray-600">Due: {new Date(task.deadline).toLocaleDateString()}</p>
            </div>
          ))}
        </div>
      </div>

      {/* In Progress Column */}
      <div className="bg-white p-4 rounded-lg shadow">
        <h3 className="font-semibold mb-4">In Progress</h3>
        <div className="space-y-2">
          {inProgressTasks.map(task => (
            <div key={task.id} className="p-3 bg-gray-50 rounded hover:bg-gray-100">
              <h4 className="font-medium">{task.title}</h4>
              <p className="text-sm text-gray-600">Due: {new Date(task.deadline).toLocaleDateString()}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Completed Column */}
      <div className="bg-white p-4 rounded-lg shadow">
        <h3 className="font-semibold mb-4">Completed</h3>
        <div className="space-y-2">
          {completedTasks.map(task => (
            <div key={task.id} className="p-3 bg-gray-50 rounded hover:bg-gray-100">
              <h4 className="font-medium line-through">{task.title}</h4>
              <p className="text-sm text-gray-600">
                Completed: {new Date(task.completed_date).toLocaleDateString()}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default TaskColumns; 