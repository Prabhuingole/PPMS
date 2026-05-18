from sqlalchemy import Column, String, Integer, DateTime, Text
from app.database.session import Base
from datetime import datetime

class DocumentTemplate(Base):
    __tablename__ = "document_templates"
    
    id = Column(Integer, primary_key=True, index=True)
    doc_type = Column(String, unique=True, nullable=False) # PRD, Scope, JDR, BRD, FRS, Req Gathering
    filename = Column(String, nullable=True) # For PDF
    file_path = Column(String, nullable=True) # For PDF
    html_content = Column(Text, nullable=True) # For HTML template
    
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
