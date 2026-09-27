from fastapi import APIRouter

from backend.controllers.mock_interview_controller import (
    analyze_mock_interview_session,
    analyze_connected_mock_interview,
    continue_ai_mock_interview,
    connect_mock_interview,
    finish_ai_mock_interview,
    get_connected_mock_interview_session,
    list_connected_mock_interview_messages,
    record_mock_interview_turn,
    send_connected_mock_interview_message,
    start_ai_mock_interview,
)
from backend.models.mock_interview_schema import (
    AIBotPracticeStartRequest,
    AIBotPracticeTurnRequest,
    ChatMessageRequest,
    MockInterviewAnalyzeRequest,
    MockInterviewConnectRequest,
    MockInterviewTurnRequest,
)


router = APIRouter(prefix="/mock-interview", tags=["mock-interview"])


@router.post("/connect")
def connect_users(payload: MockInterviewConnectRequest):
    return connect_mock_interview(payload.user_id, payload.partner_id)


@router.post("/analyze")
def analyze_session(payload: MockInterviewAnalyzeRequest):
    return analyze_mock_interview_session(payload)


@router.post("/turn")
def record_turn(payload: MockInterviewTurnRequest):
    return record_mock_interview_turn(payload)


@router.get("/chat/{session_id}")
def list_chat_messages(session_id: str):
    return list_connected_mock_interview_messages(session_id)


@router.post("/chat/send")
def send_chat_message(payload: ChatMessageRequest):
    return send_connected_mock_interview_message(payload)


@router.get("/analyze/{session_id}")
def analyze_connected_session(session_id: str):
    return analyze_connected_mock_interview(session_id)


@router.get("/session/{session_id}")
def read_connected_session(session_id: str):
    return get_connected_mock_interview_session(session_id)


@router.post("/ai/start")
def start_ai_practice(payload: AIBotPracticeStartRequest):
    return start_ai_mock_interview(payload.user_id)


@router.post("/ai/turn")
def continue_ai_practice(payload: AIBotPracticeTurnRequest):
    return continue_ai_mock_interview(payload)


@router.get("/ai/finish/{session_id}")
def finish_ai_practice(session_id: str):
    return finish_ai_mock_interview(session_id)
