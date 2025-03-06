"""
Basic test script to verify the application setup is working properly.
This script tests:
1. Database connection
2. Model imports
3. Application initialization
"""

import os
import sys
from dotenv import load_dotenv

# Add the project root to the Python path
project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../"))
sys.path.insert(0, project_root)

# Import modules using absolute imports
from src.config.database import get_db_connection
from src.db.models import db, User, Task, Project  # Added Project to imports
from src.app import create_app

def test_db_connection():
    """Test the database connection"""
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute('SELECT version();')
        db_version = cur.fetchone()
        print("✅ Database connection successful")
        print(f"   PostgreSQL version: {db_version['version']}")
        cur.close()
        conn.close()
        return True
    except Exception as e:
        print(f"❌ Database connection failed: {e}")
        return False

def test_app_creation():
    """Test that the Flask app can be created"""
    try:
        app = create_app()
        print("✅ Flask application created successfully")
        print(f"   App name: {app.name}")
        print(f"   Debug mode: {app.debug}")
        return True
    except Exception as e:
        print(f"❌ Flask app creation failed: {e}")
        return False

def test_models():
    """Test that models are correctly defined"""
    try:
        # Just check that we can access model attributes without errors
        assert hasattr(User, 'id')
        assert hasattr(User, 'name')
        assert hasattr(User, 'email')
        assert hasattr(Task, 'title')
        assert hasattr(Task, 'description')
        assert hasattr(Project, 'name')  # Add Project check
        assert hasattr(Project, 'status')  # Add Project check
        print("✅ Models imported successfully")
        return True
    except Exception as e:
        print(f"❌ Model testing failed: {e}")
        return False

if __name__ == "__main__":
    # Load environment variables
    load_dotenv()
    
    print("\n=== DevSync Application Test ===\n")
    
    # Run tests
    db_ok = test_db_connection()
    models_ok = test_models()
    app_ok = test_app_creation()
    
    # Summary
    print("\n=== Test Summary ===")
    print(f"Database connection: {'✅ PASS' if db_ok else '❌ FAIL'}")
    print(f"Models definition: {'✅ PASS' if models_ok else '❌ FAIL'}")
    print(f"App creation: {'✅ PASS' if app_ok else '❌ FAIL'}")
    
    if db_ok and models_ok and app_ok:
        print("\n✅ All tests passed! The application setup is working correctly.")
        sys.exit(0)
    else:
        print("\n❌ Some tests failed. Please fix the issues before proceeding.")
        sys.exit(1)
