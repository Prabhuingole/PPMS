from sqlalchemy import Column, String, Integer, DateTime, Text, ForeignKey, Float, Boolean
from sqlalchemy.orm import relationship, backref
from app.database.session import Base
from datetime import datetime

class Timesheet(Base):
    __tablename__ = "timesheets"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=True) # Nullable for 'other' work
    date = Column(DateTime, nullable=False)
    hours = Column(Float, nullable=False)
    task_title = Column(String, nullable=True)
    description = Column(Text, nullable=True)
    task_status = Column(String, default="Ongoing") # Ongoing, Completed, etc
    category = Column(String, nullable=True) # For 'other' work
    subcategory = Column(String, nullable=True) # For 'other' work
    status = Column(String, default="pending") # pending, approved, rejected
    day = Column(String, nullable=True)
    feedback = Column(Text, nullable=True)
    attachment_path = Column(String, nullable=True)
    attachment_name = Column(String, nullable=True)
    attendance = Column(String, default="full-day")
    arrival_time = Column(String, nullable=True)
    half_day_period = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    user = relationship("User", backref=backref("timesheets", cascade="all, delete-orphan"))
    project = relationship("Project", backref="timesheets")

    @property
    def project_name(self):
        return self.project.name if self.project else (self.category or 'Other Work')
