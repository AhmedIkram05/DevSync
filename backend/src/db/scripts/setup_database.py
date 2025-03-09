"""
Database setup script with comprehensive index creation and error handling.
"""
import os
import sys
import logging
from sqlalchemy import text, inspect

# Add the backend directory to the Python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../")))

from flask import Flask
from src.config.config import get_config
from src.db.models import db
from src.db.models.models import *

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def create_index_safely(conn, index_name, table, columns):
    """Create an index with proper error handling"""
    try:
        # Format columns for the SQL statement
        col_str = ", ".join(columns) if isinstance(columns, list) else columns
        
        # First drop the index if it exists
        conn.execute(text(f"DROP INDEX IF EXISTS {index_name};"))
        
        # Create index
        conn.execute(text(f"CREATE INDEX {index_name} ON {table} ({col_str});"))
        logger.info(f"Created index {index_name} on {table}({col_str})")
        return True
    except Exception as e:
        logger.error(f"Error creating index {index_name}: {e}")
        return False

def setup_database():
    """Create all database tables and indices in one go"""
    try:
        # Create a Flask app context
        app = Flask(__name__)
        app.config.from_object(get_config())
        db.init_app(app)
        
        with app.app_context():
            # Check if tables exist and create them if not
            inspector = inspect(db.engine)
            tables = inspector.get_table_names()
            
            if not tables:
                logger.info("No tables found. Creating tables...")
                db.create_all()
                logger.info("Tables created successfully!")
            else:
                logger.info(f"Existing tables found: {', '.join(tables)}")
            
            # Create indices manually - drop and recreate all indices
            with db.engine.connect() as conn:
                # Check Notification table structure
                if 'notifications' in tables:
                    columns = [col['name'] for col in inspector.get_columns('notifications')]
                    logger.info(f"Notification table columns: {columns}")
                    
                    # Check read vs is_read column
                    read_column = 'is_read' if 'is_read' in columns else ('read' if 'read' in columns else None)
                    if read_column:
                        logger.info(f"Using '{read_column}' column for notification read status")
                    else:
                        logger.warning("Neither 'read' nor 'is_read' column exists in notifications table")
                
                # Explicitly commit before creating indices
                conn.commit()
                
                # Create indices for each table
                indices_created = 0
                
                # Users indices
                if create_index_safely(conn, "idx_users_email", "users", "email"):
                    indices_created += 1
                if create_index_safely(conn, "idx_users_role", "users", "role"):
                    indices_created += 1
                
                # Tasks indices
                task_indices = [
                    ("idx_tasks_assigned_to", "assigned_to"),
                    ("idx_tasks_created_at", "created_at"),
                    ("idx_tasks_created_by", "created_by"),
                    ("idx_tasks_deadline", "deadline"),
                    ("idx_tasks_deadline_status", ["deadline", "status"]),
                    ("idx_tasks_progress", "progress"),
                    ("idx_tasks_status", "status"),
                    ("idx_tasks_status_assigned", ["status", "assigned_to"]),
                    ("idx_tasks_updated_at", "updated_at")
                ]
                for idx_name, columns in task_indices:
                    if create_index_safely(conn, idx_name, "tasks", columns):
                        indices_created += 1
                
                # Notifications indices
                if create_index_safely(conn, "idx_notifications_created_at", "notifications", "created_at"):
                    indices_created += 1
                if read_column and create_index_safely(conn, f"idx_notifications_{read_column}", "notifications", read_column):
                    indices_created += 1
                if create_index_safely(conn, "idx_notifications_task_id", "notifications", "task_id"):
                    indices_created += 1
                if create_index_safely(conn, "idx_notifications_user_id", "notifications", "user_id"):
                    indices_created += 1
                
                # Comments indices
                comment_indices = [
                    ("idx_comments_created_at", "created_at"),
                    ("idx_comments_task_id", "task_id"),
                    ("idx_comments_user_id", "user_id")
                ]
                for idx_name, columns in comment_indices:
                    if create_index_safely(conn, idx_name, "comments", columns):
                        indices_created += 1
                
                # Other tables indices
                if create_index_safely(conn, "idx_github_repositories_name", "github_repositories", "repo_name"):
                    indices_created += 1
                if create_index_safely(conn, "idx_github_tokens_user_id", "github_tokens", "user_id"):
                    indices_created += 1
                if create_index_safely(conn, "idx_task_github_links_repo_id", "task_github_links", "repo_id"):
                    indices_created += 1
                if create_index_safely(conn, "idx_task_github_links_task_id", "task_github_links", "task_id"):
                    indices_created += 1
                
                # Add unique constraint for github_repositories with proper error handling
                try:
                    # First check if it already exists
                    result = conn.execute(text("""
                        SELECT constraint_name 
                        FROM information_schema.table_constraints 
                        WHERE table_name = 'github_repositories' 
                        AND constraint_type = 'UNIQUE'
                        AND constraint_name = 'github_repositories_repo_url_key'
                    """))
                    
                    constraints = list(result)
                    if not constraints:
                        # Drop any existing constraint with the same name
                        conn.execute(text("""
                            DO $$
                            BEGIN
                                BEGIN
                                    ALTER TABLE github_repositories DROP CONSTRAINT IF EXISTS github_repositories_repo_url_key;
                                EXCEPTION
                                    WHEN OTHERS THEN
                                END;
                            END $$;
                        """))
                        
                        # Create the constraint
                        conn.execute(text("""
                            ALTER TABLE github_repositories ADD CONSTRAINT github_repositories_repo_url_key UNIQUE (repo_url);
                        """))
                        logger.info("Created unique constraint on github_repositories.repo_url")
                    else:
                        logger.info("Unique constraint on github_repositories.repo_url already exists")
                except Exception as e:
                    logger.error(f"Error handling unique constraint: {e}")
                
                # Commit all changes
                conn.commit()
                logger.info(f"Created {indices_created} indices successfully")
            
            logger.info("Database setup completed")
            return True
            
    except Exception as e:
        logger.error(f"Error setting up database: {e}")
        return False

def verify_database_indices():
    """More reliable database indices verification using direct SQL query"""
    try:
        app = Flask(__name__)
        app.config.from_object(get_config())
        db.init_app(app)
        
        with app.app_context():
            # Check which tables exist
            inspector = inspect(db.engine)
            tables = inspector.get_table_names()
            logger.info(f"Found tables: {', '.join(tables)}")
            
            # Use direct SQL to check indices which is more reliable
            with db.engine.connect() as conn:
                result = conn.execute(text("""
                    SELECT
                        t.relname AS table_name,
                        i.relname AS index_name
                    FROM
                        pg_class t,
                        pg_class i,
                        pg_index ix
                    WHERE
                        t.oid = ix.indrelid
                        AND i.oid = ix.indexrelid
                        AND t.relkind = 'r'
                        AND t.relname NOT LIKE 'pg_%'
                        AND t.relname NOT LIKE 'sql_%'
                    ORDER BY
                        t.relname,
                        i.relname;
                """))
                
                # Group indices by table
                indices_by_table = {}
                for row in result:
                    table = row[0]  # table name
                    index = row[1]  # index name
                    
                    if table not in indices_by_table:
                        indices_by_table[table] = []
                    
                    indices_by_table[table].append(index)
                
                # Print indices by table
                for table in sorted(indices_by_table.keys()):
                    logger.info(f"Indices for {table}: {indices_by_table[table]}")
                
                # Check for tables without indices
                for table in tables:
                    if table not in indices_by_table and table not in ['alembic_version', 'project_members']:
                        logger.warning(f"No indices found for {table}")
        
        return True
    except Exception as e:
        logger.error(f"Error verifying database: {e}")
        return False

if __name__ == "__main__":
    if setup_database():
        logger.info("Database setup completed successfully!")
        verify_database_indices()