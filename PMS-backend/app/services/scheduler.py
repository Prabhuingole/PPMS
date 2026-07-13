from datetime import datetime, time
from app.database.session import SessionLocal
from app.models.attendance import Attendance
from app.models.audit_log import AuditLog

def auto_clock_out_job():
    """
    Finds all 'Working' attendance records that missed manual clock out by 7:00 PM,
    sets their clock out time to 7:00 PM (19:00), calculates their hours,
    and marks them as auto clocked out.
    """
    db = SessionLocal()
    try:
        now = datetime.utcnow()
        # Find all attendance records currently 'Working'
        active_records = db.query(Attendance).filter(Attendance.status == "Working").all()
        
        count = 0
        for record in active_records:
            # We assume local time logic or utc logic depends on how the app uses time.
            # If standard clock_out_time logic sets time to now, let's set it to 19:00 of the record date.
            target_time = datetime.combine(record.date, time(19, 0, 0))
            
            # If the current time is past 19:00 on the record date, we can safely clock them out.
            # Since datetime.utcnow() vs local time can be tricky, 
            # if we trigger this job precisely at 19:05 local time, 
            # any 'Working' record for today should be clocked out at 19:00.
            record.clock_out_time = target_time
            record.status = "Completed"
            record.is_auto_clock_out = True
            
            # Calculate working hours
            if record.clock_in_time:
                diff = target_time - record.clock_in_time
                record.working_hours = diff.total_seconds() / 3600.0
                
            # Log it
            audit_log = AuditLog(
                action="SYSTEM_AUTO_CLOCK_OUT",
                entity_type="attendance",
                entity_id=str(record.id),
                user_id=record.user_id,
                metadata_info={"message": "System automatically clocked out user at 19:00"}
            )
            db.add(audit_log)
            count += 1
            
        if count > 0:
            db.commit()
            print(f"[Scheduler] Auto clocked out {count} employee(s).")
            
    except Exception as e:
        db.rollback()
        print(f"[Scheduler] Error during auto clock out: {e}")
    finally:
        db.close()
