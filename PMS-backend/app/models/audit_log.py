from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database.session import Base

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, index=True, nullable=True) # Optional for system actions
    user_name = Column(String, nullable=True)
    action = Column(String, index=True, nullable=False) # e.g., "PROJECT_UPDATED", "TIMESHEET_APPROVED"
    entity_type = Column(String, index=True, nullable=False) # e.g., "project", "employee"
    entity_id = Column(String, index=True, nullable=False) # Can be string or int cast to string
    old_values = Column(JSON, nullable=True)
    new_values = Column(JSON, nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    ip_address = Column(String, nullable=True)
    metadata_info = Column(JSON, nullable=True) # Renamed from 'metadata' as it conflicts with SQLAlchemy's built-in metadata property
