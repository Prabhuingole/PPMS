from sqlalchemy import Column, Integer, String, DateTime, Float, ForeignKey, Date, Boolean
from sqlalchemy.orm import relationship, backref
from datetime import datetime
from app.database.session import Base

class Attendance(Base):
    __tablename__ = "attendance"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    
    date = Column(Date, nullable=False, index=True)
    
    clock_in_time = Column(DateTime, nullable=False)
    clock_in_photo = Column(String, nullable=False)
    
    clock_out_time = Column(DateTime, nullable=True)
    clock_out_photo = Column(String, nullable=True)
    
    working_hours = Column(Float, nullable=True)
    
    status = Column(String, default="Working", index=True) # "Working", "Completed"
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    location_accuracy = Column(Float, nullable=True)
    is_auto_clock_out = Column(Boolean, default=False, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    user = relationship("User", backref=backref("attendance_records", cascade="all, delete-orphan"))
