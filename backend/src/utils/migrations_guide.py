"""
Flask-Migrate Setup Instructions

Follow these steps to set up and use Flask-Migrate for database migrations:

1. Installation
   -------------
   Install required packages (already in requirements.txt):
   pip install -r requirements.txt

2. Initialize Migrations
   --------------------
   In the backend directory, run:
   flask --app app.py db init
   
   This creates a migrations folder with the necessary files.

3. Create Initial Migration
   -----------------------
   Generate a migration based on your models:
   flask --app app.py db migrate -m "Initial migration"
   
   This creates a version file in migrations/versions/ with upgrade() and downgrade() functions.

4. Apply Migration
   --------------
   Apply migrations to the database:
   flask --app app.py db upgrade
   
   This runs the upgrade() function to update your database schema.

5. Making Schema Changes
   -------------------
   a. Update your models in models.py
   b. Create a new migration: flask --app app.py db migrate -m "Description of changes"
   c. Review the generated migration script
   d. Apply changes: flask --app app.py db upgrade

6. Rolling Back Changes
   ------------------
   To revert to a previous version:
   flask --app app.py db downgrade

7. Additional Commands
   -----------------
   - Show current version: flask --app app.py db current
   - View migration history: flask --app app.py db history
   - Create empty migration: flask --app app.py db revision -m "description"

Note: These commands assume you're running from the backend directory.
If environment variables aren't loading correctly, set them explicitly:

export FLASK_APP=app.py
"""
