from sqlalchemy import Column, String, Integer, DateTime, ForeignKey, Enum
from sqlalchemy.orm import relationship, backref
from app.database.session import Base
from datetime import datetime

class ProjectDocument(Base):
    __tablename__ = "project_documents"
    
    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id", ondelete="RESTRICT"), nullable=True, index=True) # Will be migrated to False
    filename = Column(String, nullable=False)
    file_path = Column(String, nullable=False)
    doc_type = Column(String, nullable=False) # PRD, Scope, JDR, BRD, FRS, Requirement Gathering
    display_name = Column(String, nullable=True)
    preparation_date = Column(DateTime, nullable=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False, index=True)
    uploaded_by_id = Column(Integer, ForeignKey("users.id", ondelete="RESTRICT"), nullable=False)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    
    project = relationship("Project", backref="documents")
    uploaded_by = relationship("User", backref="uploaded_documents")
