# This script tests the connection to the Render PostgreSQL database

import os
import sys
from dotenv import load_dotenv

# Add parent directory to path to import db_connection
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from db.db_connection import get_db_connection

def test_db_connection():
    """
    Test the connection to the database and print basic information
    """
    print("Testing connection to PostgreSQL database...")
    
    try:
        # Get database connection
        conn = get_db_connection()
        
        # Create cursor
        cur = conn.cursor()
        
        # Execute version query
        cur.execute('SELECT version();')
        
        # Fetch the PostgreSQL database version
        db_version = cur.fetchone()
        print(f"PostgreSQL database version: {db_version['version']}")
        
        # List all tables in the database
        cur.execute("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
            ORDER BY table_name;
        """)
        
        tables = cur.fetchall()
        print("\nDatabase tables:")
        for table in tables:
            print(f"- {table['table_name']}")
        
        # Close cursor and connection
        cur.close()
        conn.close()
        print("\nDatabase connection test completed successfully.")
        return True
        
    except Exception as e:
        print(f"Error connecting to the database: {e}")
        return False

if __name__ == "__main__":
    # Load environment variables from .env file
    load_dotenv()
    
    # Check if DATABASE_URL is set
    if not os.getenv('DATABASE_URL'):
        print("Error: DATABASE_URL environment variable is not set.")
        print("Please create a .env file with your DATABASE_URL.")
        print("Example: DATABASE_URL=postgresql://username:password@host:port/database")
        sys.exit(1)
    
    # Test database connection
    success = test_db_connection()
    
    # Exit with appropriate code
    sys.exit(0 if success else 1)
