import re

path = r"e:\sam projects\SPMS\PMS-backend\app\routes\timesheets.py"
with open(path, "r", encoding="utf-8") as f:
    content = f.read()

# Add billed_currency mapping to create_timesheets
content = content.replace(
    'billed_rate=current_user.hourly_rate',
    'billed_rate=current_user.hourly_rate,\n            billed_currency=current_user.currency'
)

# In update_timesheets_for_day, new_ts doesn't have billed_rate mapping currently! Let's add it.
content = content.replace(
    'status="pending"\n        )',
    'status="pending",\n            billed_rate=current_user.hourly_rate,\n            billed_currency=current_user.currency\n        )'
)

# Immutability check in update_timesheets_for_day
immutability_check = """
    # Enforce financial immutability
    for ex in existing:
        if ex.billing_status in ["invoiced", "paid"]:
            raise HTTPException(status_code=403, detail="Financial record is locked")

    if not existing:"""
content = content.replace('    if not existing:', immutability_check)

# Immutability check in update_timesheet_status
status_check = """
    ts = db.query(Timesheet).filter(Timesheet.id == timesheet_id).first()
    if not ts:
        raise HTTPException(status_code=404, detail="Timesheet not found")
        
    if ts.billing_status in ["invoiced", "paid"]:
        raise HTTPException(status_code=403, detail="Financial record is locked")
"""
content = content.replace(
    '    ts = db.query(Timesheet).filter(Timesheet.id == timesheet_id).first()\n    if not ts:\n        raise HTTPException(status_code=404, detail="Timesheet not found")',
    status_check
)

# Immutability check in bulk status update
bulk_status_check = """
    for ts in timesheets:
        if ts.billing_status in ["invoiced", "paid"]:
            raise HTTPException(status_code=403, detail="One or more financial records are locked")
        old_status = ts.status
"""
content = content.replace(
    '    for ts in timesheets:\n        old_status = ts.status',
    bulk_status_check
)

with open(path, "w", encoding="utf-8") as f:
    f.write(content)

print("timesheets.py patched for 10F!")
