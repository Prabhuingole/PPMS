import re

path = r"e:\sam projects\SPMS\PMS-backend\app\routes\employee_management.py"
with open(path, "r", encoding="utf-8") as f:
    content = f.read()

# Replace db.delete(user) and db.commit() with a try/except block catching IntegrityError
old_logic = """    old_values = {"full_name": user.full_name, "email": user.email}
    db.delete(user)
    db.commit()"""

new_logic = """    from sqlalchemy.exc import IntegrityError
    old_values = {"full_name": user.full_name, "email": user.email}
    try:
        db.delete(user)
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="Cannot delete user with historical financial records")"""

content = content.replace(old_logic, new_logic)

with open(path, "w", encoding="utf-8") as f:
    f.write(content)

print("employee_management.py patched for 10F!")
