-- This file contains the SQL schema for the database.

-- Users Table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,  -- Will store hashed passwords
  role VARCHAR(20) NOT NULL,       -- 'admin', 'team_lead', 'developer'
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tasks Table
CREATE TABLE IF NOT EXISTS tasks (
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

-- GitHub Integration Tables
CREATE TABLE IF NOT EXISTS github_tokens (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  access_token VARCHAR(255) NOT NULL,
  refresh_token VARCHAR(255),
  token_expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS github_repositories (
  id SERIAL PRIMARY KEY,
  repo_name VARCHAR(255) NOT NULL,
  repo_url VARCHAR(255) NOT NULL,
  github_id INTEGER
);

CREATE TABLE IF NOT EXISTS task_github_links (
  id SERIAL PRIMARY KEY,
  task_id INTEGER NOT NULL REFERENCES tasks(id),
  repo_id INTEGER NOT NULL REFERENCES github_repositories(id),
  issue_number INTEGER,
  pull_request_number INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Comments
CREATE TABLE IF NOT EXISTS comments (
  id SERIAL PRIMARY KEY,
  task_id INTEGER NOT NULL REFERENCES tasks(id),
  user_id INTEGER NOT NULL REFERENCES users(id),
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Notifications
CREATE TABLE IF NOT EXISTS notifications (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  task_id INTEGER REFERENCES tasks(id)
);
