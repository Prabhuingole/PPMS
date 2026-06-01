from sqlalchemy import Column, String, Integer, DateTime, Boolean
from app.database.session import Base
from datetime import datetime

class ReportingManager(Base):
    __tablename__ = "reporting_managers"
    
    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String, index=True, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    mobile_number = Column(String, unique=True, index=True, nullable=True)
    designation = Column(String, nullable=True)
    status = Column(String, default="active") # active, inactive
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
