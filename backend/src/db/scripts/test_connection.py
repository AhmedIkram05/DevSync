# This script tests the connection to the Render PostgreSQL database

import os
import sys
from dotenv import load_dotenv

# Add the project root to the Python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../")))

# Now we can import the module
from src.config.database import get_db_connection

def test_db_connection():
    """Test the database connection and print the PostgreSQL version"""
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute('SELECT version();')
        db_version = cur.fetchone()
        print(f"Connection successful!")
        print(f"PostgreSQL database version: {db_version['version']}")
        cur.close()
        conn.close()
    except Exception as e:
        print(f"Connection failed: {e}")

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
    test_db_connection()
