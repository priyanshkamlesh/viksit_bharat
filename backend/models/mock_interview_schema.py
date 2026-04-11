from typing import List
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


class ConnectionInviteRequest(BaseModel):
    sender_id: int
    recipient_id: int


class NotificationAcceptRequest(BaseModel):
    notification_id: str


class NotificationDeclineRequest(BaseModel):
    notification_id: str


class MockTestQuestionGradeRequest(BaseModel):
    id: str
    question: str
    answer: str
    acceptedAnswers: List[str] = Field(default_factory=list)
    submitted: str


class MockTestGradeRequest(BaseModel):
    skill: str
    level: str = ""
    questions: List[MockTestQuestionGradeRequest] = Field(default_factory=list)


class ChatMessageRequest(BaseModel):
    session_id: str
    sender_id: int
    recipient_id: int
    message: str


class TechnologyGraphRequest(BaseModel):
    user_id: int
    selected_skills: List[str] = Field(default_factory=list)


class RecommendationProfileRequest(BaseModel):
    id: int | None = None
    name: str
    email: str | None = None
    goal: str = ""
    location: str = ""
    interests: List[str] = Field(default_factory=list)
    skills: dict = Field(default_factory=dict)
    mock_interview: dict = Field(default_factory=dict)


class UserRegistrationRequest(BaseModel):
    name: str
    email: str
    password: str | None = None
    age: int | None = None
    education: str = ""
    residence: str = ""
    goal: str = ""
    location: str = ""
    interests: List[str] = Field(default_factory=list)
    skills: dict | str | List[str] = Field(default_factory=dict)
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
