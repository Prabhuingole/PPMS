from app.database.session import SessionLocal
from app.models.user import User
from app.core.security import pwd_context

db = SessionLocal()
admin = db.query(User).filter(User.role == 'admin').first()
if admin:
    admin.password_hash = pwd_context.hash('Password123!')
    db.commit()
    print("Admin password updated with new rounds.")
db.close()
