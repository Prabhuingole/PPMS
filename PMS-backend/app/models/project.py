from sqlalchemy import Column, String, Integer, DateTime, Text, ForeignKey
from sqlalchemy.orm import relationship
from app.database.session import Base
from datetime import datetime
from app.models.associations import user_projects

class Project(Base):
    __tablename__ = "projects"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True, nullable=False)
    code = Column(String, unique=True, index=True, nullable=True)
    description = Column(Text, nullable=True)
    client_name = Column(String, nullable=True)
    status = Column(String, default="active") # planning, active, on-hold, completed
    start_date = Column(DateTime, default=datetime.utcnow)
    end_date = Column(DateTime, nullable=True)
    
    reporting_manager_id = Column(Integer, ForeignKey("reporting_managers.id"), nullable=True)
    
    reporting_manager = relationship("ReportingManager", backref="managed_projects")
    members = relationship("User", secondary="user_projects", backref="projects")

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
