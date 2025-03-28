# DevSync

DevSync is a development synchronisation platform that integrates database management, GitHub integration, and task tracking into one unified system.

## Overview

DevSync streamlines collaboration by connecting your database, GitHub repositories, and local development environment. It is designed to make it easy for teams to manage tasks, track issues, and synchronise changes.

## Features

- **Database Integration**: Connect to PostgreSQL databases with ease.
- **GitHub Integration**: Seamless OAuth configuration and repository tracking.
- **Task Management**: Create, update, and monitor tasks and projects.
- **Scalable Architecture**: Indexed database schema for optimal performance.

## Installation

### Prerequisites
- Python 3.8 or higher
- Node.js 14.x or higher
- npm 6.x or higher
- PostgreSQL database (local or cloud-hosted)

### Step 1: Clone the Repository
```bash
git clone https://github.com/AhmedIkram05/DevSync
cd DevSync
```

### Step 2: Setup Python Virtual Environment

#### macOS/Linux
```bash
python -m venv venv
source venv/bin/activate
```

#### Windows
```bash
python -m venv venv
venv\Scripts\activate
```

### Step 3: Install Backend Dependencies
```bash
pip install -r requirements.txt
```

### Step 4: Setup Frontend
```bash
cd frontend
npm install
```

## Running The Application
### Backend Server
```bash
source venv/bin/activate  # If not already activated
cd backend/src
python app.py
```
The API server will start running on http://localhost:8000

### Frontend Server
```bash
cd frontend
npm run build
serve -s build
```
The React app should automatically open in your browser at http://localhost:3000

## Configuration

### Environment Variables
Create a `.env` file in the `backend/src` directory and add the following variables:
```env
# Flask Application Settings
FLASK_APP=backend/src/app.py
FLASK_ENV=development

# Database Configuration
DATABASE_URL=your_database_connection_string

# Authentication
JWT_SECRET_KEY=your_secure_secret_key
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60

# GitHub OAuth
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
GITHUB_REDIRECT_URI=http://localhost:8000/api/v1/github/callback
FRONTEND_URL=http://localhost:3000
```

### Database Setup
1. Create a PostgreSQL database.
2. Update the `DATABASE_URL` in your `.env` file with your database connection string.
3. Run the following command to create the necessary tables and indices:
```bash
python backend/src/db/scripts/setup_database.py
```

## Contributing
We welcome contributions! Please follow these steps:
1. Fork the repository.
2. Create a new branch (`git checkout -b feature/YourFeature`).
3. Make your changes and commit them (`git commit -m 'Add some feature'`).
4. Push to the branch (`git push origin feature/YourFeature`).
5. Open a pull request.
6. Ensure your code adheres to the project's coding standards and passes all tests.
7. Add tests for any new features or bug fixes.
8. Update the documentation as necessary.
9. Ensure all existing tests pass.
10. Review the pull request and address any feedback.
11. Merge the pull request once approved.
12. Delete the branch after merging to keep the repository clean.
13. Celebrate your contribution to the project!

### API Documentation
The API documentation is available at `/api/docs` endpoint.
