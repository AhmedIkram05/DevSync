# ER Diagram for DevSync Database

## Entities and Relationships Included

### Entities:
1. **Users**
   - Attributes: id, name, email, password, role, created_at

2. **Tasks**
   - Attributes: id, title, description, status, progress, assigned_to, created_by, deadline, created_at, updated_at

3. **GitHub Tokens**
   - Attributes: id, user_id, access_token, refresh_token, token_expires_at, created_at

4. **GitHub Repositories**
   - Attributes: id, repo_name, repo_url, github_id

5. **Task GitHub Links**
   - Attributes: id, task_id, repo_id, issue_number, pull_request_number, created_at

6. **Comments**
   - Attributes: id, task_id, user_id, content, created_at

7. **Notifications**
   - Attributes: id, user_id, content, is_read, created_at, task_id

### Relationships:
- One user can have many tasks (created_by)
- One user can be assigned many tasks (assigned_to)
- One user can have many GitHub tokens (one-to-many)
- One task can have many comments (one-to-many)
- One task can have many GitHub links (one-to-many)
- One GitHub repository can be linked to many tasks (one-to-many)
- One user can have many notifications (one-to-many)
- One task can be associated with many notifications (one-to-many)