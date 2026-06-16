from sqlalchemy import Column, String, Integer, DateTime, Text, ForeignKey, Float
from sqlalchemy.orm import relationship
from app.database.session import Base
from datetime import datetime
from app.models.associations import user_projects, project_companies

class Project(Base):
    __tablename__ = "projects"
    id = Column(Integer, primary_key=True, index=True)
    owner_company_id = Column(Integer, ForeignKey("companies.id", ondelete="RESTRICT"), nullable=True, index=True) # Will be migrated to False
    name = Column(String, index=True, nullable=False)
    code = Column(String, unique=True, index=True, nullable=True)
    description = Column(Text, nullable=True)
    client_name = Column(String, nullable=True)
    status = Column(String, default="active", index=True) # planning, active, on-hold, completed
    start_date = Column(DateTime, default=datetime.utcnow)
    end_date = Column(DateTime, nullable=True)
    total_hours = Column(Float, default=0.0)
    
    reporting_manager_id = Column(Integer, ForeignKey("reporting_managers.id"), nullable=True)
    
    reporting_manager = relationship("ReportingManager", backref="managed_projects")
    members = relationship("User", secondary="user_projects", backref="projects")
    owner_company = relationship("Company", foreign_keys=[owner_company_id], backref="owned_projects")
    client_company_id = Column(Integer, ForeignKey("companies.id", ondelete="RESTRICT"), nullable=True, index=True)
    client_company = relationship("Company", foreign_keys=[client_company_id], backref="client_projects")
    participating_companies = relationship("Company", secondary="project_companies", backref="participating_projects")

    deliverables = relationship("Deliverable", back_populates="project")
    tasks = relationship("Task", back_populates="project")
    allocations = relationship("ResourceAllocation", back_populates="project")

    @property
    def owner_company_name(self):
        return self.owner_company.name if self.owner_company else None

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
