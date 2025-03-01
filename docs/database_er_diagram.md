# DevSync Database ER Diagram

Below is a simple ER Diagram for our database to help our teammates understand the main tables and their relationships.

```mermaid
erDiagram
    USERS ||--o{ TASKS : "creates/assigned"
    USERS ||--o{ PROJECTS : "owns"
    USERS ||--o{ COMMENTS : "writes"
    USERS ||--o{ NOTIFICATIONS : "receives"
    USERS ||--o{ GITHUB_TOKENS : "has"
    
    TASKS ||--o{ COMMENTS : "includes"
    TASKS ||--o{ NOTIFICATIONS : "triggers"
    TASKS ||--o{ TASK_GITHUB_LINKS : "links"
    
    PROJECTS ||--o{ PROJECT_TASKS : "contains"
    TASKS ||--o{ PROJECT_TASKS : "referenced by"
    
    TASK_GITHUB_LINKS }o--|| GITHUB_REPOSITORIES : "references"
    
    USERS {
        int id PK
        string name
        string email
        string password
        string role
        timestamp createdAt
    }
    
    TASKS {
        int id PK
        string title
        text description
        string status
        int progress
        int assignedTo FK
        int createdBy FK
        timestamp deadline
        timestamp createdAt
        timestamp updatedAt
    }
    
    PROJECTS {
        int id PK
        string name
        text description
        int createdBy FK
        timestamp createdAt
        timestamp updatedAt
    }
    
    PROJECT_TASKS {
        int id PK
        int projectId FK
        int taskId FK
    }
    
    COMMENTS {
        int id PK
        int taskId FK
        int userId FK
        text content
        timestamp createdAt
    }
    
    NOTIFICATIONS {
        int id PK
        int userId FK
        text content
        boolean isRead
        timestamp createdAt
        int taskId FK
    }
    
    GITHUB_TOKENS {
        int id PK
        int userId FK
        string accessToken
        string refreshToken
        timestamp tokenExpiresAt
        timestamp createdAt
    }
    
    GITHUB_REPOSITORIES {
        int id PK
        string repoName
        string repoUrl
        int githubId
    }
    
    TASK_GITHUB_LINKS {
        int id PK
        int taskId FK
        int repoId FK
        int issueNumber
        int pullRequestNumber
        timestamp createdAt
    }
```

This diagram provides an overview of the database structure with primary and foreign keys along with key relationships.
