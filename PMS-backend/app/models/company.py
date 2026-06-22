from sqlalchemy import Column, String, Integer, Text, DateTime, JSON, Boolean
from sqlalchemy.orm import relationship
from app.database.session import Base
from datetime import datetime

class Company(Base):
    __tablename__ = "companies"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True, nullable=False)
    company_name = Column(String, nullable=True)
    code = Column(String, unique=True, index=True, nullable=True)
    address = Column(Text, nullable=True)
    city = Column(String, nullable=True)
    gst_number = Column(String, nullable=True)
    contact_person = Column(String, nullable=True)
    email = Column(String, nullable=True)
    phone = Column(String, nullable=True)
    status = Column(String, default="active")
    company_type = Column(String, default="client", index=True)
    company_owner = Column(String, nullable=True)
    logo_url = Column(String, nullable=True)
    points_of_contact = Column(JSON, default=list)
    
    restrict_clockin_to_office_ip = Column(Boolean, default=False)
    office_ip_addresses = Column(JSON, default=list)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships will be defined in other models back-referencing here
