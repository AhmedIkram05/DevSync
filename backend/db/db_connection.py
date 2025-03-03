# This script creates a connection to the PostgreSQL database and initialises the database schema.

import os
import glob
from dotenv import load_dotenv

# Only use psycopg2cffi which works with Python 3.13
try:
    from psycopg2cffi import connect
    from psycopg2cffi.extras import RealDictCursor
except ImportError:
    raise ImportError("psycopg2cffi is not available. Please install it with: pip install psycopg2cffi")

# Load environment variables
load_dotenv()

def get_db_connection():
    """
    Creates and returns a connection to the database defined in DATABASE_URL environment variable
    """
    connection_string = os.getenv('DATABASE_URL')
    print(f"Attempting to connect with connection string: {connection_string}")
    
    try:
        conn = connect(
            connection_string,
            cursor_factory=RealDictCursor
        )
        return conn
    except Exception as e:
        print(f"Database connection error: {e}")
        raise

def init_db():
    """
    Initialize the database by running all migration scripts in order
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        # Get all migration files in order
        migration_dir = os.path.join(os.path.dirname(__file__), 'migrations')
        migration_files = sorted(glob.glob(os.path.join(migration_dir, '*.sql')))
        
        for migration_file in migration_files:
            print(f"Applying migration: {os.path.basename(migration_file)}")
            
            # Read migration file
            with open(migration_file, 'r') as f:
                sql_script = f.read()
                
            # Execute the SQL script
            cursor.execute(sql_script)
            conn.commit()
            
        print("Database initialization completed successfully")
            
    except Exception as e:
        print(f"Error initializing database: {e}")
        conn.rollback()
    finally:
        cursor.close()
        conn.close()

if __name__ == "__main__":
    # Test database connection
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute('SELECT version();')
    db_version = cur.fetchone()
    print(f"PostgreSQL database version: {db_version['version']}")
    
    # Initialize database schema
    init_db()
    
    cur.close()
    conn.close()
