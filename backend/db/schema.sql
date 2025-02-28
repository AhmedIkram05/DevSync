-- Users Table
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,  -- Will store hashed passwords
  role VARCHAR(20) NOT NULL,       -- 'admin', 'team_lead', 'developer'
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tasks Table
CREATE TABLE tasks (
  id SERIAL PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  status VARCHAR(20) NOT NULL,     -- 'new', 'in_progress', 'resolved', 'closed'
  progress INTEGER DEFAULT 0,      -- Percentage complete (0-100)
  assigned_to INTEGER REFERENCES users(id),
  created_by INTEGER NOT NULL REFERENCES users(id),
  deadline TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Projects Table (not explicitly defined in requirements but likely needed)
CREATE TABLE projects (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  created_by INTEGER NOT NULL REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Project-Task relationship
CREATE TABLE project_tasks (
  id SERIAL PRIMARY KEY,
  project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  task_id INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  UNIQUE(project_id, task_id)
);

-- GitHub Integration Tables
CREATE TABLE github_tokens (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  access_token VARCHAR(255) NOT NULL,
  refresh_token VARCHAR(255),
  token_expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE github_repositories (
  id SERIAL PRIMARY KEY,
  repo_name VARCHAR(255) NOT NULL,
  repo_url VARCHAR(255) NOT NULL,
  github_id INTEGER,
  UNIQUE(repo_url)
);

CREATE TABLE task_github_links (
  id SERIAL PRIMARY KEY,
  task_id INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  repo_id INTEGER NOT NULL REFERENCES github_repositories(id) ON DELETE CASCADE,
  issue_number INTEGER,
  pull_request_number INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Comments
CREATE TABLE comments (
  id SERIAL PRIMARY KEY,
  task_id INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE SET NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Notifications
CREATE TABLE notifications (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  task_id INTEGER REFERENCES tasks(id) ON DELETE CASCADE
);

-- Create indexes for performance optimization
CREATE INDEX idx_tasks_assigned_to ON tasks(assigned_to);
CREATE INDEX idx_tasks_created_by ON tasks(created_by);
CREATE INDEX idx_comments_task_id ON comments(task_id);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_task_github_links_task_id ON task_github_links(task_id);
