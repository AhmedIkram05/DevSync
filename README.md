# DevSync

DevSync is a development synchronisation platform that integrates database management, GitHub integration, and task tracking into one unified system.

## Overview

DevSync streamlines collaboration by connecting your database, GitHub repositories, and local development environment. It is designed to make it easy for teams to manage tasks, track issues, and synchronise changes.

## Features

- **Database Integration**: Connect to a Render PostgreSQL database with ease.
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