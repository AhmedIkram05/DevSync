import os
from dotenv import load_dotenv

# Use psycopg2cffi instead of psycopg2
try:
    # Try to use psycopg2cffi which works better with newer Python versions
    from psycopg2cffi import connect
    from psycopg2cffi.extras import RealDictCursor
except ImportError:
    try:
        # Fall back to psycopg2 if psycopg2cffi is not available
        from psycopg2 import connect
        from psycopg2.extras import RealDictCursor
    except ImportError:
        raise ImportError("Neither psycopg2cffi nor psycopg2 are available. Please install one of them.")

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
    Initialize the database by creating tables if they don't exist
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        # Read schema.sql file
        with open(os.path.join(os.path.dirname(__file__), 'schema.sql'), 'r') as f:
            sql_script = f.read()
            
        # Execute the SQL script
        cursor.execute(sql_script)
        conn.commit()
        print("Database schema initialized successfully")
    except Exception as e:
        print(f"Error initializing database schema: {e}")
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
