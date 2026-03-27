from copy import deepcopy
from datetime import datetime, timezone
import uuid

from backend.models.recommendation_model import recommend_users
from backend.services import (
    create_user,
    get_user_by_email,
    get_user_by_id,
    get_notification,
    list_users,
    list_notifications,
    save_notification,
    save_collaboration_profile_doc,
    save_user,
    seed_users_if_needed,
)


def load_users():
    seed_users_if_needed()
    return list_users()


def _normalize_skill_map(skills):
    if isinstance(skills, list):
        normalized = {}
        for skill in skills:
            if isinstance(skill, str) and skill.strip():
                normalized[skill.strip().lower().replace(" ", "-")] = 50
            elif isinstance(skill, dict):
                name = str(skill.get("name") or "").strip().lower().replace(" ", "-")
                if not name:
                    continue
                level = str(skill.get("level") or "intermediate").lower()
                normalized[name] = 80 if level == "pro" else 50 if level == "intermediate" else 30
        return normalized

    if isinstance(skills, dict):
        normalized = {}
        for skill, score in skills.items():
            if not isinstance(skill, str) or not skill.strip():
                continue
            normalized[skill.strip().lower().replace(" ", "-")] = int(score) if isinstance(score, (int, float)) else 50
        return normalized

    return {}


def _normalize_target_user(target_user):
    target_user = deepcopy(target_user or {})
    skills = _normalize_skill_map(target_user.get("skills", {}))

    return {
        "id": target_user.get("id"),
        "name": target_user.get("name") or target_user.get("username") or "Current User",
        "email": target_user.get("email"),
        "goal": target_user.get("goal", ""),
        "location": target_user.get("location", ""),
        "interests": target_user.get("interests", []),
        "skills": skills,
        "mock_interview": target_user.get("mock_interview", {}),
    }


def _normalize_user_record(user):
    collaboration_profile = user.get("collaboration_profile", {})
    return {
        "id": user.get("id"),
        "name": user.get("name") or user.get("username") or "Unknown",
        "goal": user.get("goal", ""),
        "location": user.get("location", ""),
        "interests": user.get("interests", []),
        "mock_interview_enabled": user.get("mock_interview", {}).get("enabled", False),
        "skills": user.get("skills", {}),
        "email": user.get("email", ""),
        "college": collaboration_profile.get("college", user.get("college", "")),
        "domain": collaboration_profile.get("domain", user.get("domain", "")),
        "portfolio_photo_url": collaboration_profile.get("portfolio_photo_url", user.get("portfolio_photo_url", "")),
        "portfolio_banner_url": collaboration_profile.get("portfolio_banner_url", user.get("portfolio_banner_url", "")),
        "bio": collaboration_profile.get("bio", user.get("bio", "")),
    }


def get_users():
    return {"users": [_normalize_user_record(user) for user in load_users()]}


def get_user(user_id):
    return get_user_by_id(user_id)


def get_user_by_email_address(email):
    return get_user_by_email(email)


def _merge_profile_into_user(user, profile):
    collaboration_skills = profile.get("skills", [])
    user["name"] = profile.get("username", user.get("name"))
    user["email"] = profile.get("email", user.get("email", "")).strip().lower()
    user["location"] = profile.get("location", user.get("location", ""))
    user["college"] = profile.get("college", user.get("college", ""))
    user["domain"] = profile.get("domain", user.get("domain", "Backend"))
    user["interests"] = profile.get("interests", user.get("interests", []))
    user["bio"] = profile.get("bio", user.get("bio", ""))
    user["github_url"] = profile.get("github_url", user.get("github_url", ""))
    user["linkedin_url"] = profile.get("linkedin_url", user.get("linkedin_url", ""))
    user["portfolio_photo_url"] = profile.get("portfolio_photo_url", user.get("portfolio_photo_url", ""))
    user["portfolio_banner_url"] = profile.get("portfolio_banner_url", user.get("portfolio_banner_url", ""))
    user["collaboration_skills"] = collaboration_skills
    user["skills"] = _normalize_skill_map(collaboration_skills) or user.get("skills", {})
    user["goal"] = user.get("goal") or f"Grow from {user.get('college', 'college')} into a job-ready profile"
    user["mock_interview"] = user.get("mock_interview", {
        "enabled": True,
        "target_role": "Software Engineer",
        "experience_level": "beginner",
        "focus_areas": [],
    })
    return user


def get_or_create_user_from_registration(payload):
    email = (payload.get("email") or "").strip().lower()
    existing = get_user_by_email(email)
    skills_value = payload.get("skills", [])
    skills_map = _normalize_skill_map(
        [skill.strip() for skill in skills_value.split(",")] if isinstance(skills_value, str) else skills_value
    )

    if existing:
        existing["name"] = (payload.get("name") or existing.get("name") or "New User").strip()
        existing["email"] = email
        existing["goal"] = payload.get("education") or existing.get("goal") or "Build a job-ready profile"
        existing["location"] = (payload.get("residence") or existing.get("location") or "").strip()
        existing["skills"] = skills_map or existing.get("skills", {})
        existing["mock_interview"] = {
            "enabled": True,
            "target_role": "Software Engineer",
            "experience_level": "beginner",
            "focus_areas": list(existing.get("skills", {}).keys())[:4],
        }
        return save_user(existing)

    user = {
        "id": None,
        "name": (payload.get("name") or "New User").strip(),
        "email": email,
        "goal": payload.get("education") or "Build a job-ready profile",
        "location": (payload.get("residence") or "").strip(),
        "interests": ["career-growth", "collaboration"],
        "skills": skills_map,
        "mock_interview": {
            "enabled": True,
            "target_role": "Software Engineer",
            "experience_level": "beginner",
            "focus_areas": list(skills_map.keys())[:4],
        },
    }
    return create_user(user)


def get_or_create_user_from_oauth_profile(profile):
    provider = (profile.get("provider") or "").strip().lower()
    provider_user_id = str(profile.get("provider_user_id") or profile.get("id") or "").strip()
    email = (profile.get("email") or "").strip().lower()
    name = (profile.get("name") or profile.get("login") or "New User").strip()
    avatar_url = (profile.get("avatar_url") or "").strip()
    profile_url = (profile.get("profile_url") or "").strip()

    if not email:
        email = f"{provider}-{provider_user_id}@oauth.local" if provider and provider_user_id else "oauth-user@oauth.local"

    existing_user = None
    if provider and provider_user_id:
        existing_user = next(
            (
                user
                for user in load_users()
                if str(user.get("oauth_provider")).lower() == provider
                and str(user.get("oauth_provider_id")) == provider_user_id
            ),
            None,
        )

    if existing_user is None and email:
        existing_user = get_user_by_email(email)

    if existing_user:
        existing_user["name"] = (existing_user.get("name") or name).strip()
        existing_user["email"] = email
        existing_user["oauth_provider"] = provider or existing_user.get("oauth_provider", "")
        existing_user["oauth_provider_id"] = provider_user_id or existing_user.get("oauth_provider_id", "")
        existing_user["oauth_avatar_url"] = avatar_url or existing_user.get("oauth_avatar_url", "")
        existing_user["oauth_profile_url"] = profile_url or existing_user.get("oauth_profile_url", "")
        existing_user["goal"] = existing_user.get("goal") or "Build a job-ready profile"
        existing_user["mock_interview"] = existing_user.get("mock_interview", {
            "enabled": True,
            "target_role": "Software Engineer",
            "experience_level": "beginner",
            "focus_areas": list(existing_user.get("skills", {}).keys())[:4],
        })
        return save_user(existing_user)

    user = {
        "id": None,
        "name": name,
        "email": email,
        "goal": "Build a job-ready profile",
        "location": "",
        "interests": ["career-growth", "collaboration"],
        "skills": {},
        "oauth_provider": provider,
        "oauth_provider_id": provider_user_id,
        "oauth_avatar_url": avatar_url,
        "oauth_profile_url": profile_url,
        "mock_interview": {
            "enabled": True,
            "target_role": "Software Engineer",
            "experience_level": "beginner",
            "focus_areas": [],
        },
    }
    return create_user(user)


def save_collaboration_profile(payload):
    profile = {
        "user_id": payload.get("user_id"),
        "username": (payload.get("username") or "").strip(),
        "email": (payload.get("email") or "").strip().lower(),
        "portfolio_photo_url": payload.get("portfolio_photo_url", ""),
        "portfolio_banner_url": payload.get("portfolio_banner_url", ""),
        "location": (payload.get("location") or "").strip(),
        "college": (payload.get("college") or "").strip(),
        "domain": payload.get("domain", "Backend"),
        "skills": payload.get("skills", []),
        "interests": payload.get("interests", []),
        "bio": (payload.get("bio") or "").strip(),
        "github_url": (payload.get("github_url") or "").strip(),
        "linkedin_url": (payload.get("linkedin_url") or "").strip(),
    }

    existing_user = get_user_by_id(profile["user_id"]) or get_user_by_email(profile["email"])
    if existing_user:
        merged_user = _merge_profile_into_user(existing_user, profile)
    else:
        merged_user = {
            "id": profile["user_id"],
            "name": profile["username"] or "New User",
            "email": profile["email"],
            "goal": f"Grow from {profile['college'] or 'college'} into a job-ready profile",
            "location": profile["location"],
            "interests": profile["interests"],
            "skills": _normalize_skill_map(profile["skills"]),
            "mock_interview": {
                "enabled": True,
                "target_role": profile["domain"] or "Software Engineer",
                "experience_level": "beginner",
                "focus_areas": list(_normalize_skill_map(profile["skills"]).keys())[:4],
            },
        }
        merged_user = _merge_profile_into_user(merged_user, profile)

    merged_user["collaboration_profile"] = {
        "user_id": profile["user_id"],
        "username": profile["username"],
        "email": profile["email"],
        "portfolio_photo_url": profile["portfolio_photo_url"],
        "portfolio_banner_url": profile["portfolio_banner_url"],
        "location": profile["location"],
        "college": profile["college"],
        "domain": profile["domain"],
        "skills": profile["skills"],
        "interests": profile["interests"],
        "bio": profile["bio"],
        "github_url": profile["github_url"],
        "linkedin_url": profile["linkedin_url"],
    }

    saved_user = save_user(merged_user)

    saved_profile = save_collaboration_profile_doc(profile)
    return {
        "message": "Collaboration profile saved successfully",
        "profile": saved_profile or profile,
        "user": saved_user or profile,
    }


def get_recommendations(user_id):
    users = load_users()
    target = next((u for u in users if u["id"] == user_id), None)

    if not target:
        return {"error": "User not found"}

    recommendations = recommend_users(target, users)

    return {
        "user": target["name"],
        "recommendations": recommendations,
    }


def get_recommendations_for_profile(target_user):
    users = load_users()
    normalized_target = _normalize_target_user(target_user)

    recommendations = recommend_users(normalized_target, users)

    return {
        "user": normalized_target["name"],
        "profile": normalized_target,
        "recommendations": recommendations,
    }


def _now_iso():
    return datetime.now(timezone.utc).isoformat()


def create_connection_invite(sender_id, recipient_id):
    sender = get_user_by_id(sender_id)
    recipient = get_user_by_id(recipient_id)

    if not sender or not recipient:
        return {"error": "Sender or recipient not found"}

    notification = {
        "id": str(uuid.uuid4()),
        "type": "connection_request",
        "status": "pending",
        "sender_id": sender["id"],
        "sender_name": sender.get("name", "Unknown"),
        "sender_email": sender.get("email", ""),
        "recipient_id": recipient["id"],
        "recipient_name": recipient.get("name", "Unknown"),
        "recipient_email": recipient.get("email", ""),
        "created_at": _now_iso(),
        "accepted_at": "",
        "rejected_at": "",
        "session_id": "",
    }

    saved = save_notification(notification)
    return {
        "message": "Connection request sent",
        "notification": saved or notification,
    }


def list_user_notifications(user_id):
    return {"notifications": list_notifications(user_id)}


def accept_connection_invite(notification_id):
    notification = get_notification(notification_id)
    if not notification:
        return {"error": "Notification not found"}

    if notification.get("status") != "pending":
        return {"error": "Notification has already been handled"}

    from backend.controllers.mock_interview_controller import connect_mock_interview

    session = connect_mock_interview(notification["sender_id"], notification["recipient_id"])
    if session.get("error"):
        return session

    notification["status"] = "accepted"
    notification["accepted_at"] = _now_iso()
    notification["session_id"] = session["session_id"]
    save_notification(notification)

    return {
        "message": "Connection accepted",
        "notification": notification,
        "session": session,
    }


def decline_connection_invite(notification_id):
    notification = get_notification(notification_id)
    if not notification:
        return {"error": "Notification not found"}

    if notification.get("status") != "pending":
        return {"error": "Notification has already been handled"}

    notification["status"] = "rejected"
    notification["rejected_at"] = _now_iso()
    save_notification(notification)

    return {
        "message": "Connection declined",
        "notification": notification,
    }
