from app.database.session import SessionLocal, engine, Base
from app.models.user import User
from app.core.security import get_password_hash
from app.core.config import settings

def seed_db():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    
    # Check if admin exists
    admin = db.query(User).filter(User.email == settings.SUPERADMIN_EMAIL).first()
    if not admin:
        new_admin = User(
            email=settings.SUPERADMIN_EMAIL,
            hashed_password=get_password_hash(settings.SUPERADMIN_PASSWORD),
            name="System Admin",
            role="superadmin"
        )
        db.add(new_admin)
        db.commit()
        print(f"Superadmin created: {settings.SUPERADMIN_EMAIL}")
    db.close()

if __name__ == "__main__":
    seed_db()