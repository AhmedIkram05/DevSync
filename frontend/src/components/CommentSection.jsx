import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { taskService } from "../services/api";

const CommentSection = ({ taskId, comments = [], onCommentAdded }) => {
  const { currentUser } = useAuth();
  const [newComment, setNewComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!newComment.trim()) return;
    
    try {
      setIsSubmitting(true);
      setError(null);
      
      const commentData = {
        content: newComment.trim(),
        author_id: currentUser.id,
        author_name: currentUser.name || currentUser.email
      };
      
      const response = await taskService.addTaskComment(taskId, commentData);
      
      // Clear input
      setNewComment("");
      
      // Notify parent component to update comments list
      if (onCommentAdded) {
        onCommentAdded(response);
      }
    } catch (err) {
      console.error("Failed to post comment:", err);
      setError("Failed to post comment. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Format date to be more readable
  const formatDate = (dateString) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString(undefined, { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return 'Invalid date';
    }
  };

  return (
    <div className="bg-white rounded-lg">
      <h3 className="text-lg font-semibold mb-4">Comments</h3>
      
      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4" role="alert">
          <p>{error}</p>
        </div>
      )}
      
      {/* Comments list */}
      <div className="space-y-4 max-h-96 overflow-y-auto mb-6">
        {comments && comments.length > 0 ? (
          comments.map((comment) => (
            <div key={comment.id} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <div className="flex justify-between items-start">
                <span className="font-medium text-gray-700">{comment.author_name}</span>
                <span className="text-xs text-gray-500">{formatDate(comment.created_at)}</span>
              </div>
              <p className="mt-2 text-gray-700 whitespace-pre-line">{comment.content}</p>
            </div>
          ))
        ) : (
          <div className="text-center py-8 text-gray-500">
            No comments yet. Be the first to add one!
          </div>
        )}
      </div>
      
      {/* Add comment form */}
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Add your comment..."
            rows={3}
            disabled={isSubmitting}
            required
          />
        </div>
        
        <div className="flex justify-end">
          <button
            type="submit"
            className={`px-4 py-2 rounded ${
              isSubmitting || !newComment.trim() ? 
                'bg-gray-300 cursor-not-allowed' : 
                'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
            disabled={isSubmitting || !newComment.trim()}
          >
            {isSubmitting ? "Posting..." : "Post Comment"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CommentSection;