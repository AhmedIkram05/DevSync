# DevSync Project Tracker with GitHub Integration
## Overview

DevSync is a project tracker application that integrates seamlessly with GitHub. It combines efficient task management with automated GitHub repository linking, empowering teams to streamline their workflows.

## Features

- **Task Management**: Create, assign, and track tasks with deadlines and progress updates.
- **Project Organization**: Manage multiple projects and their associated tasks effortlessly.
- **GitHub Integration**: Automatically sync issues and pull requests with GitHub.
- **Database Support**: Built with PostgreSQL and SQLAlchemy for reliable data handling.
- **Secure Authentication**: Utilize JWT tokens to ensure secure access.

## Installation

1. **Clone the repository:**
   ```
   git clone <repository-url>
   cd DevSync
   ```
2. **Set up a virtual environment:**
   ```
   python -m venv venv
   #MacOS: source venv/bin/activate  # Windows: venv\Scripts\activate
   ```
3. **Install dependencies:**
   ```
   pip install -r requirements.txt
   ```
4. **Configure Environment Variables:**
   Create a `.env` file in the root directory with the necessary configurations (see provided `.env` example).

## Database Setup

Initialize the PostgreSQL database and create tables by running:
```
python backend/db/db_connection.py
```
This executes the SQL schema defined in `backend/db/schema.sql`.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.