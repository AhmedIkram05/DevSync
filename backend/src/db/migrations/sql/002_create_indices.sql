-- This file contains SQL statements to create indices for the database.

-- Performance optimization indices for DevSync database
-- Run this after schema creation to add indices for frequently queried columns

-- User-related indices
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);  -- For authentication lookups
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);    -- For role-based filtering

-- Task-related indices
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);  -- For filtering tasks by status
CREATE INDEX IF NOT EXISTS idx_tasks_deadline ON tasks(deadline);  -- For deadline sorting and filtering
CREATE INDEX IF NOT EXISTS idx_tasks_progress ON tasks(progress);  -- For progress filtering
CREATE INDEX IF NOT EXISTS idx_tasks_created_at ON tasks(created_at);  -- For timeline views
CREATE INDEX IF NOT EXISTS idx_tasks_updated_at ON tasks(updated_at);  -- For recent activity views
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tasks_created_by ON tasks(created_by);

-- Composite indices for common query patterns
CREATE INDEX IF NOT EXISTS idx_tasks_status_assigned ON tasks(status, assigned_to);  -- For "my tasks by status"
CREATE INDEX IF NOT EXISTS idx_tasks_deadline_status ON tasks(deadline, status);  -- For "upcoming deadlines by status" 

-- GitHub integration indices
CREATE INDEX IF NOT EXISTS idx_github_tokens_user_id ON github_tokens(user_id);  -- For user token lookups
CREATE INDEX IF NOT EXISTS idx_github_repositories_name ON github_repositories(repo_name);  -- For repository name searches

-- Task-GitHub links indices
CREATE INDEX IF NOT EXISTS idx_task_github_links_task_id ON task_github_links(task_id);
CREATE INDEX IF NOT EXISTS idx_task_github_links_repo_id ON task_github_links(repo_id);

-- Activity-related indices
CREATE INDEX IF NOT EXISTS idx_comments_created_at ON comments(created_at);  -- For recent comments
CREATE INDEX IF NOT EXISTS idx_comments_task_id ON comments(task_id);
CREATE INDEX IF NOT EXISTS idx_comments_user_id ON comments(user_id);

-- Notification-related indices
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);  -- For unread notifications
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);  -- For recent notifications
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_task_id ON notifications(task_id);
