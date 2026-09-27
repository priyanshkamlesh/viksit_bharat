from fastapi import APIRouter, HTTPException
from backend.models.chatbot_model import ChatbotMessageRequest, ChatbotMessageResponse
from backend.controllers.chatbot_controller import handle_chatbot_message

router = APIRouter(prefix="/chatbot", tags=["chatbot"])


@router.post("/message", response_model=ChatbotMessageResponse)
def send_message(request: ChatbotMessageRequest):
    """
    Send a message to the chatbot with optional resume context.
    
    - **message**: User's question or doubt
    - **resume_text**: Optional resume text for ATS analysis
    - **resume_file_name**: Optional name of uploaded resume file
    - **history**: Optional chat history for context
    """
    try:
        result = handle_chatbot_message(request)
        return ChatbotMessageResponse(**result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
