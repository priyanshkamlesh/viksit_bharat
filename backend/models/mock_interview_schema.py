from typing import List, Optional
from pydantic import BaseModel, Field


class ParticipantInterviewData(BaseModel):
    user_id: int
    asked_questions: List[str] = Field(default_factory=list)
    answers: List[str] = Field(default_factory=list)


class MockInterviewConnectRequest(BaseModel):
    user_id: int
    partner_id: int


class MockInterviewAnalyzeRequest(BaseModel):
    session_id: str
    participant_one: ParticipantInterviewData
    participant_two: ParticipantInterviewData


class MockInterviewTurnRequest(BaseModel):
    session_id: str
    asker_id: int
    responder_id: int
    question: str
    answer: str


class AIBotPracticeStartRequest(BaseModel):
    user_id: int


class AIBotPracticeTurnRequest(BaseModel):
    session_id: str
    answer: str


class MockTestGenerateRequest(BaseModel):
    category: str
    skill: str = ""
    question_count: int = Field(default=10, ge=10, le=20)


class ConnectionInviteRequest(BaseModel):
    sender_id: int
    recipient_id: int


class NotificationAcceptRequest(BaseModel):
    notification_id: str


class NotificationDeclineRequest(BaseModel):
    notification_id: str


class ChatMessageRequest(BaseModel):
    session_id: str
    sender_id: int
    recipient_id: int
    message: str


class RecommendationProfileRequest(BaseModel):
    id: Optional[int] = None
    name: str
    email: Optional[str] = None
    goal: str = ""
    location: str = ""
    interests: List[str] = Field(default_factory=list)
    skills: dict = Field(default_factory=dict)
    mock_interview: dict = Field(default_factory=dict)


class UserRegistrationRequest(BaseModel):
    name: str
    email: str
    password: Optional[str] = None
    age: Optional[int] = None
    education: str = ""
    residence: str = ""
    goal: str = ""
    location: str = ""
    interests: List[str] = Field(default_factory=list)
    skills: Optional[dict] = Field(default_factory=dict)
    mock_interview: dict = Field(default_factory=dict)


class CollaborationProfileRequest(BaseModel):
    user_id: int
    username: str
    email: str
    portfolio_photo_url: str = ""
    portfolio_banner_url: str = ""
    location: str = ""
    college: str = ""
    domain: str = "Backend"
    branch: str = ""
    job_role: str = ""
    skills: List[dict] = Field(default_factory=list)
    interests: List[str] = Field(default_factory=list)
    bio: str = ""
    github_url: str = ""
    linkedin_url: str = ""
