from sqlalchemy import Column, String, Integer, DateTime, ForeignKey, Enum
from sqlalchemy.orm import relationship, backref
from app.database.session import Base
from datetime import datetime

class ProjectDocument(Base):
    __tablename__ = "project_documents"
    
    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String, nullable=False)
    file_path = Column(String, nullable=False)
    doc_type = Column(String, nullable=False) # PRD, Scope, JDR, BRD, FRS, Requirement Gathering
    display_name = Column(String, nullable=True)
    preparation_date = Column(DateTime, nullable=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)
    uploaded_by_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    
    project = relationship("Project", backref="documents")
    uploaded_by = relationship("User", backref=backref("uploaded_documents", cascade="all, delete-orphan"))
