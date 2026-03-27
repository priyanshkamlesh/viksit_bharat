import json
import os
import secrets
from urllib.parse import urlencode
from urllib.request import Request as UrlRequest, urlopen

from fastapi import APIRouter, Request
from fastapi.responses import RedirectResponse

from backend.controllers.recommendation_controller import (
    get_or_create_user_from_registration,
    get_or_create_user_from_oauth_profile,
    accept_connection_invite,
    create_connection_invite,
    decline_connection_invite,
    get_recommendations,
    get_recommendations_for_profile,
    list_user_notifications,
    get_user,
    get_user_by_email_address,
    get_users,
    save_collaboration_profile,
)
from backend.models.mock_interview_schema import (
    CollaborationProfileRequest,
    ConnectionInviteRequest,
    NotificationAcceptRequest,
    NotificationDeclineRequest,
    RecommendationProfileRequest,
    UserRegistrationRequest,
)

router = APIRouter()

GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth"
GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
GOOGLE_USERINFO_URL = "https://openidconnect.googleapis.com/v1/userinfo"

GITHUB_AUTH_URL = "https://github.com/login/oauth/authorize"
GITHUB_TOKEN_URL = "https://github.com/login/oauth/access_token"
GITHUB_USER_URL = "https://api.github.com/user"
GITHUB_EMAILS_URL = "https://api.github.com/user/emails"


def _frontend_url(path="", params=None):
    base = os.getenv("FRONTEND_URL", "http://localhost:5173").rstrip("/")
    url = f"{base}{path}"
    if params:
        url = f"{url}?{urlencode(params)}"
    return url


def _backend_url(path):
    base = os.getenv("BACKEND_URL", "http://localhost:8000").rstrip("/")
    return f"{base}{path}"


def _cookie_secure_flag():
    return os.getenv("OAUTH_COOKIE_SECURE", "false").lower() == "true"


def _cookie_name(provider):
    return f"oauth_state_{provider}"


def _request_json(url, method="GET", data=None, headers=None):
    payload = urlencode(data).encode("utf-8") if data is not None else None
    request_headers = {"Accept": "application/json"}
    if data is not None:
        request_headers["Content-Type"] = "application/x-www-form-urlencoded"
    if headers:
        request_headers.update(headers)

    request = UrlRequest(url, data=payload, headers=request_headers, method=method)
    with urlopen(request, timeout=20) as response:
        content = response.read().decode("utf-8")
        return json.loads(content) if content else {}


def _redirect_error(provider, message):
    return RedirectResponse(
        _frontend_url("/auth/callback", {"provider": provider, "error": message}),
        status_code=302,
    )


def _redirect_success(user_id, provider):
    return RedirectResponse(
        _frontend_url("/auth/callback", {"provider": provider, "user_id": user_id}),
        status_code=302,
    )


def _google_profile_from_code(code):
    client_id = os.getenv("GOOGLE_CLIENT_ID")
    client_secret = os.getenv("GOOGLE_CLIENT_SECRET")
    if not client_id or not client_secret:
        raise RuntimeError("Google OAuth is not configured")

    token = _request_json(
        GOOGLE_TOKEN_URL,
        method="POST",
        data={
            "code": code,
            "client_id": client_id,
            "client_secret": client_secret,
            "redirect_uri": _backend_url("/auth/google/callback"),
            "grant_type": "authorization_code",
        },
    )
    access_token = token.get("access_token")
    if not access_token:
        raise RuntimeError("Google access token was not returned")

    profile = _request_json(
        GOOGLE_USERINFO_URL,
        headers={"Authorization": f"Bearer {access_token}"},
    )

    return {
        "provider": "google",
        "provider_user_id": profile.get("sub"),
        "email": profile.get("email"),
        "name": profile.get("name") or profile.get("given_name") or "Google User",
        "avatar_url": profile.get("picture", ""),
        "profile_url": "",
    }


def _github_profile_from_code(code):
    client_id = os.getenv("GITHUB_CLIENT_ID")
    client_secret = os.getenv("GITHUB_CLIENT_SECRET")
    if not client_id or not client_secret:
        raise RuntimeError("GitHub OAuth is not configured")

    token = _request_json(
        GITHUB_TOKEN_URL,
        method="POST",
        data={
            "code": code,
            "client_id": client_id,
            "client_secret": client_secret,
            "redirect_uri": _backend_url("/auth/github/callback"),
        },
        headers={"Accept": "application/json"},
    )
    access_token = token.get("access_token")
    if not access_token:
        raise RuntimeError("GitHub access token was not returned")

    profile = _request_json(
        GITHUB_USER_URL,
        headers={
            "Authorization": f"Bearer {access_token}",
            "Accept": "application/vnd.github+json",
            "X-GitHub-Api-Version": "2022-11-28",
        },
    )
    emails = _request_json(
        GITHUB_EMAILS_URL,
        headers={
            "Authorization": f"Bearer {access_token}",
            "Accept": "application/vnd.github+json",
            "X-GitHub-Api-Version": "2022-11-28",
        },
    )

    email = profile.get("email")
    if not email and isinstance(emails, list):
        primary_email = next((item.get("email") for item in emails if item.get("primary") and item.get("verified")), None)
        email = primary_email or next((item.get("email") for item in emails if item.get("verified")), None)

    if not email:
        email = f"github-{profile.get('id') or profile.get('login') or 'user'}@users.noreply.github.com"

    return {
        "provider": "github",
        "provider_user_id": profile.get("id"),
        "email": email,
        "name": profile.get("name") or profile.get("login") or "GitHub User",
        "avatar_url": profile.get("avatar_url", ""),
        "profile_url": profile.get("html_url", ""),
    }


def _google_start_response():
    client_id = os.getenv("GOOGLE_CLIENT_ID")
    if not client_id:
        return _redirect_error("google", "Google OAuth is not configured")

    state = secrets.token_urlsafe(24)
    auth_params = {
        "client_id": client_id,
        "redirect_uri": _backend_url("/auth/google/callback"),
        "response_type": "code",
        "scope": "openid email profile",
        "state": state,
        "prompt": "select_account",
    }
    response = RedirectResponse(f"{GOOGLE_AUTH_URL}?{urlencode(auth_params)}", status_code=302)
    response.set_cookie(
        key=_cookie_name("google"),
        value=state,
        httponly=True,
        samesite="lax",
        secure=_cookie_secure_flag(),
        max_age=600,
    )
    return response


def _github_start_response():
    client_id = os.getenv("GITHUB_CLIENT_ID")
    if not client_id:
        return _redirect_error("github", "GitHub OAuth is not configured")

    state = secrets.token_urlsafe(24)
    auth_params = {
        "client_id": client_id,
        "redirect_uri": _backend_url("/auth/github/callback"),
        "scope": "read:user user:email",
        "state": state,
        "allow_signup": "true",
    }
    response = RedirectResponse(f"{GITHUB_AUTH_URL}?{urlencode(auth_params)}", status_code=302)
    response.set_cookie(
        key=_cookie_name("github"),
        value=state,
        httponly=True,
        samesite="lax",
        secure=_cookie_secure_flag(),
        max_age=600,
    )
    return response


@router.get("/auth/google/start")
def google_start():
    return _google_start_response()


@router.get("/auth/google/callback")
def google_callback(request: Request, code: str | None = None, state: str | None = None, error: str | None = None):
    if error:
        return _redirect_error("google", error)

    cookie_state = request.cookies.get(_cookie_name("google"))
    if not code:
        return _redirect_error("google", "Google login did not return an authorization code")
    if not state or state != cookie_state:
        return _redirect_error("google", "Google login state check failed")

    profile = _google_profile_from_code(code)
    user = get_or_create_user_from_oauth_profile(profile)
    response = _redirect_success(user.get("id"), "google")
    response.delete_cookie(_cookie_name("google"))
    return response


@router.get("/auth/github/start")
def github_start():
    return _github_start_response()


@router.get("/auth/github/callback")
def github_callback(request: Request, code: str | None = None, state: str | None = None, error: str | None = None):
    if error:
        return _redirect_error("github", error)

    cookie_state = request.cookies.get(_cookie_name("github"))
    if not code:
        return _redirect_error("github", "GitHub login did not return an authorization code")
    if not state or state != cookie_state:
        return _redirect_error("github", "GitHub login state check failed")

    profile = _github_profile_from_code(code)
    user = get_or_create_user_from_oauth_profile(profile)
    response = _redirect_success(user.get("id"), "github")
    response.delete_cookie(_cookie_name("github"))
    return response


@router.get("/auth/config")
def auth_config():
    return {
        "google": {
            "configured": bool(os.getenv("GOOGLE_CLIENT_ID") and os.getenv("GOOGLE_CLIENT_SECRET")),
        },
        "github": {
            "configured": bool(os.getenv("GITHUB_CLIENT_ID") and os.getenv("GITHUB_CLIENT_SECRET")),
        },
    }

@router.get("/recommend/users")
def users():
    return get_users()


@router.get("/users/by-email/{email}")
def read_user_by_email(email: str):
    user = get_user_by_email_address(email)
    return {"user": user} if user else {"error": "User not found"}


@router.get("/users/{user_id}")
def read_user(user_id: int):
    user = get_user(user_id)
    return {"user": user} if user else {"error": "User not found"}


@router.get("/notifications/{user_id}")
def read_notifications(user_id: int):
    return list_user_notifications(user_id)


@router.post("/notifications/send")
def send_connection_invite(payload: ConnectionInviteRequest):
    return create_connection_invite(payload.sender_id, payload.recipient_id)


@router.post("/notifications/accept")
def accept_connection(payload: NotificationAcceptRequest):
    return accept_connection_invite(payload.notification_id)


@router.post("/notifications/decline")
def decline_connection(payload: NotificationDeclineRequest):
    return decline_connection_invite(payload.notification_id)


@router.post("/users/register")
def register_user(payload: UserRegistrationRequest):
    user = get_or_create_user_from_registration(payload.model_dump())
    return {"message": "User registered successfully", "user": user}


@router.put("/users/{user_id}/collaboration")
def update_collaboration_profile(user_id: int, payload: CollaborationProfileRequest):
    data = payload.model_dump()
    data["user_id"] = user_id
    return save_collaboration_profile(data)


@router.post("/collaboration/profile")
def collaboration_profile(payload: CollaborationProfileRequest):
    return save_collaboration_profile(payload.model_dump())


@router.post("/recommend/profile")
def recommend_profile(payload: dict):
    return get_recommendations_for_profile(payload)


@router.get("/recommend/{user_id}")
def recommend(user_id: int):
    return get_recommendations(user_id)
