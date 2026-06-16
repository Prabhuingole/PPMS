from sqlalchemy import Column, Integer, Float, DateTime, ForeignKey, Boolean, Index
from sqlalchemy.orm import relationship
from app.database.session import Base
from datetime import datetime

class ResourceAllocation(Base):
    __tablename__ = "resource_allocations"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="RESTRICT"), nullable=False, index=True)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="RESTRICT"), nullable=False, index=True)
    allocated_hours_per_week = Column(Float, nullable=False)
    start_date = Column(DateTime, nullable=False)
    end_date = Column(DateTime, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Composite Indexes
    __table_args__ = (
        Index("idx_allocations_user_dates", "user_id", "start_date", "end_date"),
        Index("idx_allocations_project_user", "project_id", "user_id"),
    )

    # Relationships
    user = relationship("User", backref="allocations")
    project = relationship("Project", back_populates="allocations")
