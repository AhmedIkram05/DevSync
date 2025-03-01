# DevSync Database Implementation

This directory contains the database implementation for the DevSync application.

## Directory Structure

```
/backend/db/
├── db_connection.py              # Database connection and initialization script
├── migrations/                   # Database migration files
│   ├── 001_initial_schema.sql    # Main database schema definition
│   └── 002_create_indices.sql    # Performance optimization indices
├── scripts/                      # Utility scripts for database operations
│   └── test_connection.py        # Script to test database connectivity
└── docs/                         # Documentation
    ├── README.md                 # Detailed documentation
    └── er_diagram_instructions.md # Instructions for ER diagram creation
```

## Getting Started

1. **Environment Setup**

   Ensure your `.env` file at the project root contains:
   ```
   DATABASE_URL=postgresql://[user]:[password]@[host]:[port]/[database]
   ```

   For Render, your connection string is already configured.

2. **Dependencies**

   The required Python packages are listed in the backend/requirements.txt file:
   ```bash
   pip install -r backend/requirements.txt
   ```

3. **Testing the Connection**

   To verify your Render PostgreSQL connection:
   ```bash
   python backend/db/check_render_connection.py
   ```

4. **Initializing the Database**

   To create all tables and indices:
   ```bash
   python backend/db/test_migrations.py
   ```

## Database Schema

The database includes the following tables:

- **users**: User accounts and authentication
  - Fields: id, name, email, password (hashed), role, created_at
  
- **tasks**: Development tasks and their status
  - Fields: id, title, description, status, progress, assigned_to, created_by, deadline, created_at, updated_at

- **GitHub Integration**:
  - **github_tokens**: OAuth tokens for GitHub API access
  - **github_repositories**: Tracked repositories
  - **task_github_links**: Connections between tasks and GitHub issues/PRs

- **Activity Tracking**:
  - **comments**: Task discussions
  - **notifications**: User notifications

## Performance Optimization

Performance indices have been created for frequently queried fields to ensure the application remains responsive even with larger datasets. See `migrations/002_create_indices.sql` for the complete list of optimizations.

## Modifying the Schema

When you need to make changes to the database schema:

1. Create a new migration file in the `migrations` directory with a sequential number
2. Apply the migration by running the initialization script

## Troubleshooting

If you encounter database connection issues:

1. Verify your DATABASE_URL is correctly set in the .env file
2. Ensure the Render PostgreSQL service is running
3. Check for network connectivity to the Render server
4. Try connecting with the `check_render_connection.py` script to isolate if it's a code or connection issue
