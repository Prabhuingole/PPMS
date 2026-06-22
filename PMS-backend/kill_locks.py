import sys
import os
import traceback

sys.path.insert(0, os.path.abspath("e:/sam projects/SPMS/PMS-backend"))

try:
    from app.database.session import engine
    from sqlalchemy import text
    
    with engine.connect() as conn:
        print("Terminating blocking queries...")
        # This works in PostgreSQL to kill queries that are blocking the DB
        conn.execute(text("""
            SELECT pg_terminate_backend(pid) 
            FROM pg_stat_activity 
            WHERE state = 'active' 
              AND pid <> pg_backend_pid();
        """))
        conn.commit()
        print("Done.")
except Exception as e:
    print(e)
    traceback.print_exc()
