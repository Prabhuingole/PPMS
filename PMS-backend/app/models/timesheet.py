from sqlalchemy import Column, String, Integer, DateTime, Text, ForeignKey, Float, Boolean
from sqlalchemy.orm import relationship
from app.database.session import Base
from datetime import datetime

class Timesheet(Base):
    __tablename__ = "timesheets"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)
    date = Column(DateTime, nullable=False)
    hours = Column(Float, nullable=False)
    description = Column(Text, nullable=True)
    status = Column(String, default="pending") # pending, approved, rejected
    created_at = Column(DateTime, default=datetime.utcnow)
    
    user = relationship("User", backref="timesheets")
    project = relationship("Project", backref="timesheets")

    @property
    def project_name(self):
        return self.project.name if self.project else None
