import ProgressBar from "../components/ProgressBar";
import CommentSection from "../components/CommentSection";

const TaskDetails = () => {
  const task = {
    id: 1,
    title: "Fix API Bug",
    description: "Resolve authentication issues",
    deadline: "2025-02-25",
    progress: 50,
    comments: ["Great progress!", "Need to fix the login issue."],
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Task Details</h1>
      <div className="bg-white p-4 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold">{task.title}</h3>
        <p className="text-gray-600">{task.description}</p>
        <div className="mt-2">
          <span className="text-sm text-gray-500">Deadline: {task.deadline}</span>
          <ProgressBar progress={task.progress} />
        </div>
        <CommentSection comments={task.comments} />
      </div>
    </div>
  );
};

export default TaskDetails;