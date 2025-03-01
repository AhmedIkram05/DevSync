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

## DbDiagram Code Example
```
Table users {
  id serial [pk]
  name varchar(100) [not null]
  email varchar(100) [unique, not null]
  password varchar(255) [not null]
  role varchar(20) [not null]
  created_at timestamp
}

Table tasks {
  id serial [pk]
  title varchar(200) [not null]
  description text
  status varchar(20) [not null]
  progress integer
  assigned_to integer [ref: > users.id]
  created_by integer [ref: > users.id, not null]
  deadline timestamp
  created_at timestamp
  updated_at timestamp
}

Table github_tokens {
  id serial [pk]
  user_id integer [ref: > users.id, not null]
  access_token varchar(255) [not null]
  refresh_token varchar(255)
  token_expires_at timestamp
  created_at timestamp
}

Table github_repositories {
  id serial [pk]
  repo_name varchar(255) [not null]
  repo_url varchar(255) [not null]
  github_id integer
}

Table task_github_links {
  id serial [pk]
  task_id integer [ref: > tasks.id, not null]
  repo_id integer [ref: > github_repositories.id, not null]
  issue_number integer
  pull_request_number integer
  created_at timestamp
}

Table comments {
  id serial [pk]
  task_id integer [ref: > tasks.id, not null]
  user_id integer [ref: > users.id, not null]
  content text [not null]
  created_at timestamp
}

Table notifications {
  id serial [pk]
  user_id integer [ref: > users.id, not null]
  content text [not null]
  is_read boolean
  created_at timestamp
  task_id integer [ref: > tasks.id]
}
```

After creating the diagram, export it as an image and save it in this directory as `er_diagram.png`.
