# DevSync Database Schema Visualisation

This document provides a visual representation of the DevSync database schema using ASCII art.

## Entity Relationship Diagram (ASCII)

```
+----------------+       +----------------+       +-------------------+
|     users      |       |     tasks      |       |   github_tokens   |
+----------------+       +----------------+       +-------------------+
| id (PK)        |<---+  | id (PK)        |       | id (PK)           |
| name           |    |  | title          |       | user_id (FK)      |--+
| email          |    +--| created_by (FK)|       | access_token      |  |
| password       |    |  | assigned_to (FK)|-+    | refresh_token     |  |
| role           |    |  | status         | |    | token_expires_at   |  |
| created_at     |<-+ |  | progress       | |    | created_at        |  |
+----------------+  | |  | deadline       | |    +-------------------+  |
                    | |  | created_at     | |                           |
                    | |  | updated_at     | |                           |
                    | |  +----------------+ |                           |
                    | |                     |                           |
                    | |  +----------------+ |    +-------------------+  |
                    | |  |    comments    | |    | github_repositories| |
                    | |  +----------------+ |    +-------------------+  |
                    | +->| id (PK)        | |    | id (PK)           |  |
                    |    | task_id (FK)   |-+    | repo_name         |  |
                    +----| user_id (FK)   |      | repo_url          |  |
                         | content        |      | github_id         |  |
                         | created_at     |      +-------------------+  |
                         +----------------+               ^             |
                                                          |             |
                         +----------------+     +-----------------+     |
                         | notifications  |     | task_github_links|    |
                         +----------------+     +-----------------+     |
                         | id (PK)        |     | id (PK)         |     |
                         | user_id (FK)   |-----| task_id (FK)    |     |
                         | content        |     | repo_id (FK)    |-----+
                         | is_read        |     | issue_number    |
                         | created_at     |     | pull_request_num|
                         | task_id (FK)   |     | created_at      |
                         +----------------+     +-----------------+
```

## Key Relationships

1. **Users and Tasks**:
   - One user can create many tasks (created_by)
   - One user can be assigned many tasks (assigned_to)

2. **Users and GitHub**:
   - One user can have multiple GitHub tokens

3. **Tasks and GitHub**:
   - Tasks can be linked to GitHub issues/PRs via task_github_links
   - One GitHub repository can be linked to many tasks

4. **Comments**:
   - Tasks can have multiple comments
   - Users can make multiple comments

5. **Notifications**:
   - Users can receive multiple notifications
   - Notifications can be associated with tasks

## Constraints

- Email addresses must be unique for each user
- Tasks must have a creator (created_by is NOT NULL)
- GitHub tokens must be associated with a user
- Comments must be associated with both a task and a user
