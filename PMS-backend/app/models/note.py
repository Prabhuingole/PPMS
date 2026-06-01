from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey, Float
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database.session import Base


class NoteWorkspace(Base):
    __tablename__ = "note_workspaces"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, index=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", backref="note_workspace")
    pages = relationship("NotePage", back_populates="workspace", cascade="all, delete-orphan", order_by="NotePage.is_pinned.desc(), NotePage.updated_at.desc()")


class NotePage(Base):
    __tablename__ = "note_pages"

    id = Column(Integer, primary_key=True, index=True)
    workspace_id = Column(Integer, ForeignKey("note_workspaces.id", ondelete="CASCADE"), index=True, nullable=False)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"), index=True, nullable=True)
    title = Column(String, default="Untitled", nullable=False)
    content = Column(Text, nullable=True)
    category = Column(String, default="general", index=True, nullable=False)  # keep for legacy or optional use
    is_pinned = Column(Boolean, default=False)
    is_archived = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    workspace = relationship("NoteWorkspace", back_populates="pages")
    project = relationship("Project", backref="note_pages")
    checklist_items = relationship("NoteChecklistItem", back_populates="page", cascade="all, delete-orphan", order_by="NoteChecklistItem.sort_order.asc()")


class NoteChecklistItem(Base):
    __tablename__ = "note_checklist_items"

    id = Column(Integer, primary_key=True, index=True)
    page_id = Column(Integer, ForeignKey("note_pages.id", ondelete="CASCADE"), index=True, nullable=False)
    text = Column(String, nullable=False)
    is_completed = Column(Boolean, default=False)
    completed_at = Column(DateTime, nullable=True)
    sort_order = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    page = relationship("NotePage", back_populates="checklist_items")
