import sys
import traceback

with open("e:\\sam projects\\SPMS\\PMS-backend\\patch_log.txt", "w") as log_file:
    try:
        from app.database.session import engine
        from sqlalchemy import text
        
        with engine.begin() as conn:
            log_file.write("Checking columns...\n")
            res = conn.execute(text("SELECT column_name FROM information_schema.columns WHERE table_name = 'companies'"))
            columns = [r[0] for r in res]
            log_file.write(f"Columns in companies: {columns}\n")
            
            if 'restrict_clockin_to_office_ip' not in columns:
                log_file.write("Adding restrict_clockin_to_office_ip...\n")
                conn.execute(text("ALTER TABLE companies ADD COLUMN restrict_clockin_to_office_ip BOOLEAN DEFAULT FALSE;"))
            else:
                log_file.write("restrict_clockin_to_office_ip already exists.\n")
                
            if 'office_ip_addresses' not in columns:
                log_file.write("Adding office_ip_addresses...\n")
                conn.execute(text("ALTER TABLE companies ADD COLUMN office_ip_addresses JSON DEFAULT '[]'::json;"))
            else:
                log_file.write("office_ip_addresses already exists.\n")
                
        log_file.write("DONE PATCHING.\n")
    except Exception as e:
        log_file.write(f"FAILED: {e}\n")
        traceback.print_exc(file=log_file)
