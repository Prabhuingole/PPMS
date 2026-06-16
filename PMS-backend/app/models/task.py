import enum
from sqlalchemy import Column, String, Integer, Float, DateTime, ForeignKey, Text, Boolean, Index
from sqlalchemy.orm import relationship
from app.database.session import Base
from datetime import datetime

class TaskStatus(str, enum.Enum):
    BACKLOG = "BACKLOG"
    TODO = "TODO"
    IN_PROGRESS = "IN_PROGRESS"
    BLOCKED = "BLOCKED"
    REVIEW = "REVIEW"
    DONE = "DONE"

class TaskPriority(str, enum.Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"

class Task(Base):
    __tablename__ = "tasks"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="RESTRICT"), nullable=False, index=True)
    deliverable_id = Column(Integer, ForeignKey("deliverables.id", ondelete="RESTRICT"), nullable=True, index=True)
    assignee_id = Column(Integer, ForeignKey("users.id", ondelete="RESTRICT"), nullable=True, index=True)
    creator_id = Column(Integer, ForeignKey("users.id", ondelete="RESTRICT"), nullable=False, index=True)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    estimated_hours = Column(Float, nullable=False)
    actual_hours = Column(Float, default=0.0, nullable=False)
    status = Column(String, default=TaskStatus.BACKLOG, nullable=False)
    priority = Column(String, default=TaskPriority.MEDIUM, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    due_date = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Composite Indexes
    __table_args__ = (
        Index("idx_tasks_project_status", "project_id", "status"),
        Index("idx_tasks_project_assignee", "project_id", "assignee_id"),
    )

    # Relationships
    project = relationship("Project", back_populates="tasks")
    deliverable = relationship("Deliverable", back_populates="tasks")
    comments = relationship("TaskComment", back_populates="task", cascade="all, delete-orphan")
    assignee = relationship("User", foreign_keys=[assignee_id], backref="assigned_tasks")
    creator = relationship("User", foreign_keys=[creator_id], backref="created_tasks")
