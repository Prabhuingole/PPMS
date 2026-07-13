from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.database.session import get_db
from app.models.notification import Notification
from app.schemas.notification import NotificationResponse
from app.core.deps import get_current_user

router = APIRouter(prefix="/inbox", tags=["Notifications"])

@router.get("/me", response_model=List[NotificationResponse])
def get_my_notifications(db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    # The user requested that notifications clear automatically after being read.
    # Therefore we only return unread notifications.
    notifications = db.query(Notification).filter(
        Notification.user_id == current_user.id,
        Notification.is_read == False
    ).order_by(Notification.created_at.desc()).limit(50).all()
    return notifications

@router.put("/{notification_id}/read")
def mark_notification_as_read(notification_id: int, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    notification = db.query(Notification).filter(
        Notification.id == notification_id,
        Notification.user_id == current_user.id
    ).first()
    
    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found")
        
    notification.is_read = True
    db.commit()
    return {"message": "Notification marked as read"}

@router.put("/read-all")
def mark_all_as_read(db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    db.query(Notification).filter(
        Notification.user_id == current_user.id,
        Notification.is_read == False
    ).update({"is_read": True})
    
    db.commit()
    return {"message": "All notifications marked as read"}
