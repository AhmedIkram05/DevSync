"""
Database inspection script for seeing details about schema, tables, and indices.
"""
import os
import sys
import logging
from sqlalchemy import text

# Add the backend directory to the Python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../")))

from flask import Flask
from src.config.config import get_config
from src.db.models import db

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def inspect_database():
    """Inspect database schema in detail"""
    try:
        app = Flask(__name__)
        app.config.from_object(get_config())
        db.init_app(app)
        
        with app.app_context():
            with db.engine.connect() as conn:
                # List tables
                result = conn.execute(text("""
                    SELECT tablename 
                    FROM pg_catalog.pg_tables 
                    WHERE schemaname != 'pg_catalog' AND schemaname != 'information_schema';
                """))
                tables = [row[0] for row in result]
                print(f"== Tables ({len(tables)}) ==")
                for table in sorted(tables):
                    print(f"  - {table}")
                print()
                
                # List indices
                result = conn.execute(text("""
                    SELECT
                        t.relname AS table_name,
                        i.relname AS index_name,
                        a.attname AS column_name
                    FROM
                        pg_class t,
                        pg_class i,
                        pg_index ix,
                        pg_attribute a
                    WHERE
                        t.oid = ix.indrelid
                        AND i.oid = ix.indexrelid
                        AND a.attrelid = t.oid
                        AND a.attnum = ANY(ix.indkey)
                        AND t.relkind = 'r'
                        AND t.relname NOT LIKE 'pg_%'
                        AND t.relname NOT LIKE 'sql_%'
                    ORDER BY
                        t.relname,
                        i.relname;
                """))
                
                indices_by_table = {}
                for row in result:
                    table = row[0]
                    index = row[1]
                    column = row[2]
                    
                    if table not in indices_by_table:
                        indices_by_table[table] = {}
                    
                    if index not in indices_by_table[table]:
                        indices_by_table[table][index] = []
                    
                    indices_by_table[table][index].append(column)
                
                print(f"== Indices by Table ==")
                for table in sorted(indices_by_table.keys()):
                    print(f"  Table: {table}")
                    for index, columns in indices_by_table[table].items():
                        print(f"    - {index}: {', '.join(columns)}")
                    print()
                
        return True
    except Exception as e:
        logger.error(f"Error inspecting database: {e}")
        return False

if __name__ == "__main__":
    inspect_database()
