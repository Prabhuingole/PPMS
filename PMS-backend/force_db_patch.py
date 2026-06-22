import sys
import os
import traceback

sys.path.insert(0, os.path.abspath("e:/sam projects/SPMS/PMS-backend"))

with open("e:/sam projects/SPMS/PMS-backend/force_patch_log.txt", "w") as log:
    try:
        from app.database.session import engine
        from sqlalchemy import text
        
        with engine.begin() as conn:
            log.write("Executing patch...\n")
            try:
                conn.execute(text("ALTER TABLE companies ADD COLUMN restrict_clockin_to_office_ip BOOLEAN DEFAULT FALSE;"))
                log.write("Added restrict_clockin_to_office_ip\n")
            except Exception as e:
                log.write(f"Failed to add restrict_clockin_to_office_ip: {e}\n")
                
            try:
                conn.execute(text("ALTER TABLE companies ADD COLUMN office_ip_addresses JSON DEFAULT '[]'::json;"))
                log.write("Added office_ip_addresses\n")
            except Exception as e:
                log.write(f"Failed to add office_ip_addresses: {e}\n")
        
        log.write("Done.\n")
    except Exception as e:
        log.write(f"CRITICAL ERROR: {e}\n")
        traceback.print_exc(file=log)
