import uuid
from datetime import datetime

from backend.controllers.recommendation_controller import load_users
from backend.models.interview_model import (
    build_ai_practice_feedback,
    build_feedback,
    generate_ai_question,
)
from backend.models.recommendation_model import calculate_score
from backend.services import get_mock_session, save_mock_session


SESSIONS = {}
AI_PRACTICE_SESSIONS = {}

def _find_user(users, user_id):
    return next((user for user in users if user["id"] == user_id), None)


def _build_all_skills(users):
    all_skills = set()
    for user in users:
        all_skills.update(user["skills"].keys())
    return all_skills


def _find_participant_bucket(session, user_id):
    for bucket in session["transcript"]:
        if bucket["user_id"] == user_id:
            return bucket
    return None


def _load_session(session_id, session_type):
    stored = get_mock_session(session_id)
    if stored and stored.get("type") == session_type:
        return stored

    if session_type == "ai_mock_interview":
        return AI_PRACTICE_SESSIONS.get(session_id)

    return SESSIONS.get(session_id)


def _persist_session(session):
    try:
        save_mock_session(session)
    except Exception:  # pragma: no cover
        pass


def _current_timestamp():
    return datetime.utcnow().isoformat()


def _build_session_feedback(session, users):
    feedback = []
    for bucket in session["transcript"]:
        user = _find_user(users, bucket["user_id"])
        if not user:
            continue
        feedback.append(build_feedback(user, bucket["asked_questions"], bucket["answers"]))
    return feedback


def connect_mock_interview(user_id, partner_id):
    users = load_users()
    user = _find_user(users, user_id)
    partner = _find_user(users, partner_id)

    if not user or not partner:
        return {"error": "One or both users were not found"}

    if not user.get("mock_interview", {}).get("enabled") or not partner.get("mock_interview", {}).get("enabled"):
        return {"error": "Both users must enable mock interviews before connecting"}

    all_skills = _build_all_skills(users)
    compatibility_score, reasons = calculate_score(user, partner, all_skills)
    session_id = str(uuid.uuid4())

    session = {
        "session_id": session_id,
        "type": "mock_interview",
        "participants": [
            {
                "id": user["id"],
                "name": user["name"],
                "target_role": user["mock_interview"]["target_role"],
            },
            {
                "id": partner["id"],
                "name": partner["name"],
                "target_role": partner["mock_interview"]["target_role"],
            },
        ],
        "compatibility_score": compatibility_score,
        "match_reasons": reasons,
        "status": "connected",
        "transcript": [
            {
                "user_id": user["id"],
                "asked_questions": [],
                "answers": [],
            },
            {
                "user_id": partner["id"],
                "asked_questions": [],
                "answers": [],
            },
        ],
        "chat_messages": [],
        "turns": [],
    }
    SESSIONS[session_id] = session
    _persist_session(session)
    return session


def _session_chat_messages(session):
    return sorted(session.get("chat_messages", []), key=lambda item: item.get("created_at", ""))


def list_connected_mock_interview_messages(session_id):
    session = _load_session(session_id, "mock_interview")
    if not session:
        return {"error": "Session not found"}

    return {
        "session_id": session_id,
        "messages": _session_chat_messages(session),
    }


def send_connected_mock_interview_message(payload):
    session = _load_session(payload.session_id, "mock_interview")
    if not session:
        return {"error": "Session not found"}

    message_text = str(payload.message or "").strip()
    if not message_text:
        return {"error": "Message cannot be empty"}

    participant_ids = {participant["id"] for participant in session["participants"]}
    if payload.sender_id not in participant_ids or payload.recipient_id not in participant_ids:
        return {"error": "Both users must belong to the connected mock interview session"}

    message = {
        "id": str(uuid.uuid4()),
        "session_id": payload.session_id,
        "sender_id": payload.sender_id,
        "recipient_id": payload.recipient_id,
        "message": message_text,
        "created_at": _current_timestamp(),
    }

    session.setdefault("chat_messages", []).append(message)
    session["status"] = session.get("status") or "connected"
    SESSIONS[payload.session_id] = session
    _persist_session(session)

    return {
        "message": "Chat message sent",
        "chat_message": message,
        "messages": _session_chat_messages(session),
    }


def record_mock_interview_turn(payload):
    session = _load_session(payload.session_id, "mock_interview")
    if not session:
        return {"error": "Session not found. Connect users before recording interview turns."}

    participant_ids = {participant["id"] for participant in session["participants"]}
    if payload.asker_id not in participant_ids or payload.responder_id not in participant_ids:
        return {"error": "Turn users must belong to the connected mock interview session"}

    asker_bucket = _find_participant_bucket(session, payload.asker_id)
    responder_bucket = _find_participant_bucket(session, payload.responder_id)

    asker_bucket["asked_questions"].append(payload.question)
    responder_bucket["answers"].append(payload.answer)
    session["turns"].append(
        {
            "asker_id": payload.asker_id,
            "responder_id": payload.responder_id,
            "question": payload.question,
            "answer": payload.answer,
        }
    )
    session["status"] = "in_progress"

    users = load_users()
    SESSIONS[payload.session_id] = session
    _persist_session(session)
    return {
        "session_id": session["session_id"],
        "status": session["status"],
        "turns_recorded": len(session["turns"]),
        "latest_turn": session["turns"][-1],
        "live_feedback": _build_session_feedback(session, users),
    }


def analyze_mock_interview_session(payload):
    session = _load_session(payload.session_id, "mock_interview")
    if not session:
        return {"error": "Session not found. Connect users before analyzing the interview."}

    users = load_users()
    participant_one_user = _find_user(users, payload.participant_one.user_id)
    participant_two_user = _find_user(users, payload.participant_two.user_id)

    if not participant_one_user or not participant_two_user:
        return {"error": "Participant data does not match known users"}

    participant_one_feedback = build_feedback(
        participant_one_user,
        payload.participant_one.asked_questions,
        payload.participant_one.answers,
    )
    participant_two_feedback = build_feedback(
        participant_two_user,
        payload.participant_two.asked_questions,
        payload.participant_two.answers,
    )

    session["status"] = "analyzed"
    session["transcript"] = [
        {
            "user_id": payload.participant_one.user_id,
            "asked_questions": payload.participant_one.asked_questions,
            "answers": payload.participant_one.answers,
        },
        {
            "user_id": payload.participant_two.user_id,
            "asked_questions": payload.participant_two.asked_questions,
            "answers": payload.participant_two.answers,
        },
    ]
    SESSIONS[payload.session_id] = session
    _persist_session(session)

    return {
        "session_id": payload.session_id,
        "status": "analyzed",
        "feedback": [
            participant_one_feedback,
            participant_two_feedback,
        ],
    }


def analyze_connected_mock_interview(session_id):
    session = _load_session(session_id, "mock_interview")
    if not session:
        return {"error": "Session not found"}

    users = load_users()
    feedback = _build_session_feedback(session, users)
    session["status"] = "analyzed"
    SESSIONS[session_id] = session
    _persist_session(session)

    return {
        "session_id": session_id,
        "status": session["status"],
        "turns_recorded": len(session["turns"]),
        "feedback": feedback,
    }


def get_connected_mock_interview_session(session_id):
    session = _load_session(session_id, "mock_interview")
    if not session:
        return {"error": "Session not found"}

    return {
        "session": session,
    }


def start_ai_mock_interview(user_id):
    users = load_users()
    user = _find_user(users, user_id)
    if not user:
        return {"error": "User not found"}

    if not user.get("mock_interview", {}).get("enabled"):
        return {"error": "User must enable mock interviews before AI practice"}

    session_id = str(uuid.uuid4())
    first_question = generate_ai_question(user, [])
    session = {
        "session_id": session_id,
        "type": "ai_mock_interview",
        "user_id": user_id,
        "status": "started",
        "turns": [],
        "current_question": first_question,
    }
    AI_PRACTICE_SESSIONS[session_id] = session
    _persist_session(session)

    return {
        "session_id": session_id,
        "status": session["status"],
        "bot_name": "Interview AI Bot",
        "opening_question": first_question,
        "target_role": user["mock_interview"]["target_role"],
    }


def continue_ai_mock_interview(payload):
    session = _load_session(payload.session_id, "ai_mock_interview")
    if not session:
        return {"error": "AI practice session not found"}

    users = load_users()
    user = _find_user(users, session["user_id"])
    if not user:
        return {"error": "User not found for this AI practice session"}

    turn = {
        "bot_question": session["current_question"],
        "user_answer": payload.answer,
    }
    session["turns"].append(turn)
    session["status"] = "in_progress"

    round_feedback = build_feedback(
        user,
        [turn["bot_question"]],
        [turn["user_answer"]],
    )
    next_question = generate_ai_question(user, session["turns"])
    session["current_question"] = next_question
    AI_PRACTICE_SESSIONS[payload.session_id] = session
    _persist_session(session)

    return {
        "session_id": session["session_id"],
        "status": session["status"],
        "round_number": len(session["turns"]),
        "round_feedback": round_feedback,
        "next_question": next_question,
    }


def finish_ai_mock_interview(session_id):
    session = _load_session(session_id, "ai_mock_interview")
    if not session:
        return {"error": "AI practice session not found"}

    users = load_users()
    user = _find_user(users, session["user_id"])
    if not user:
        return {"error": "User not found for this AI practice session"}

    session["status"] = "completed"
    final_feedback = build_ai_practice_feedback(user, session["turns"])
    AI_PRACTICE_SESSIONS[session_id] = session
    _persist_session(session)

    return {
        "session_id": session_id,
        "status": session["status"],
        "feedback": final_feedback,
    }
