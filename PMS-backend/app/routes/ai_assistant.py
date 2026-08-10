from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from app.database.session import get_db
from app.services.ai_service import process_chat
from app.core.deps import get_current_user
from app.models.user import User

router = APIRouter()

class ChatRequest(BaseModel):
    prompt: str

class ChatResponse(BaseModel):
    status: str
    message: str = None
    data: dict = None

@router.post("/chat", response_model=ChatResponse)
def ai_chat_endpoint(
    request: ChatRequest, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Endpoint for interacting with the AI Assistant using 3-layer guardrails.
    """
    result = process_chat(request.prompt, current_user, db)
    
    if result.get("status") == "error":
        # We return a 400 Bad Request for validation errors or guardrail rejections
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=result.get("message"))
        
    return ChatResponse(
        status="success",
        data=result.get("data")
    )
