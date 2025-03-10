# DevSync API Routes

## Authentication Routes

**Base Path**: `/api/auth`

| Method | Endpoint    | Description                       | Authentication |
|--------|-------------|-----------------------------------|----------------|
| POST   | /register   | Creates a new user account        | None           |
| POST   | /login      | Authenticates and issues JWT      | None           |
| POST   | /refresh    | Refreshes access token            | JWT Refresh    |
| POST   | /logout     | Invalidates tokens                | None           |
| GET    | /me         | Retrieves current user profile    | JWT Access     |

### Authentication Flow

1. Register a new account using `/api/auth/register`
2. Login to get JWT tokens via `/api/auth/login`
3. Use the access token for protected endpoints
4. When the access token expires, use the refresh token to get a new one
5. Logout to invalidate tokens

### JWT Implementation

DevSync uses HTTP-only cookies for token storage with CSRF protection enabled.
The access token expires after 30 minutes, and the refresh token after 30 days.
