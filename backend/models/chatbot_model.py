from pydantic import BaseModel
from typing import Optional, List


class ChatMessage(BaseModel):
    role: str
    content: str


class ChatbotMessageRequest(BaseModel):
    message: str
    resume_text: Optional[str] = None
    resume_file_name: Optional[str] = None
    resume_file_data: Optional[str] = None
    resume_mime_type: Optional[str] = None
    history: Optional[List[ChatMessage]] = None


class ResumeFeedback(BaseModel):
    strengths: List[str] = []
    improvements: List[str] = []
    skills: List[str] = []


class ChatbotMessageResponse(BaseModel):
    answer: str
    ats_score: Optional[int] = None
    resume_feedback: Optional[ResumeFeedback] = None
    provider: str
    model: Optional[str] = None
    error: Optional[str] = None
    extraction_error: Optional[str] = None
