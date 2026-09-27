"""Backend services."""
import os
from copy import deepcopy

try:
    from pymongo import MongoClient
    from pymongo.errors import PyMongoError
    from pymongo.uri_parser import parse_uri
except ImportError:  # pragma: no cover
    MongoClient = None
    PyMongoError = Exception
    parse_uri = None


_client = None
_database = None
_last_mongo_error = None
_local_users = []
_local_notifications = []
_local_mock_sessions = []
_local_collaboration_profiles = []


def _normalize_email(email):
    return (email or "").strip().lower()


def _serialize_user(user):
    if not user:
        return None

    serialized = deepcopy(user)
    serialized.pop("_id", None)
    return serialized


def is_mongo_available():
    return MongoClient is not None and bool(os.getenv("MONGODB_URI"))


def _database_name_from_uri(mongo_uri):
    if not mongo_uri:
        return None

    if parse_uri is not None:
        parsed = parse_uri(mongo_uri)
        options = parsed.get("options") or {}
        if parsed.get("database"):
            return parsed["database"]
        if options.get("authSource"):
            return options["authSource"]

    return None


def get_database():
    global _client, _database, _last_mongo_error

    if _database is not None:
        return _database

    if not is_mongo_available():
        _last_mongo_error = "MONGODB_URI is not configured or pymongo is unavailable"
        return None

    try:
        mongo_uri = os.getenv("MONGODB_URI")
        mongo_db_name = os.getenv("MONGODB_DB") or _database_name_from_uri(mongo_uri) or "Bengalore_Hackathon"
        _client = MongoClient(mongo_uri, serverSelectionTimeoutMS=3000)
        _client.admin.command("ping")
        _database = _client[mongo_db_name]
        _last_mongo_error = None
        return _database
    except (PyMongoError, ValueError) as exc:
        _client = None
        _database = None
        _last_mongo_error = f"{type(exc).__name__}: {exc}"
        return None


def get_database_error():
    return _last_mongo_error


def users_collection():
    database = get_database()
    return database["users"] if database is not None else None


def collaboration_profiles_collection():
    database = get_database()
    return database["collaboration_profiles"] if database is not None else None


def notifications_collection():
    database = get_database()
    return database["notifications"] if database is not None else None


def mock_sessions_collection():
    database = get_database()
    return database["mock_interview_sessions"] if database is not None else None


def list_users():
    collection = users_collection()
    if collection is None:
        return [_serialize_user(user) for user in _local_users]

    return [_serialize_user(user) for user in collection.find({}, {"_id": 0})]


def get_user_by_id(user_id):
    collection = users_collection()
    if collection is None:
        return _serialize_user(next((user for user in _local_users if user.get("id") == user_id), None))

    return _serialize_user(collection.find_one({"id": user_id}, {"_id": 0}))


def get_user_by_email(email):
    normalized_email = _normalize_email(email)
    if not normalized_email:
        return None

    collection = users_collection()
    if collection is None:
        return _serialize_user(
            next((user for user in _local_users if _normalize_email(user.get("email")) == normalized_email), None)
        )

    return _serialize_user(collection.find_one({"email": normalized_email}, {"_id": 0}))


def next_user_id():
    collection = users_collection()
    if collection is None:
        ids = [user.get("id") for user in _local_users if isinstance(user.get("id"), int)]
        return max(ids, default=0) + 1

    ids = [
        doc.get("id")
        for doc in collection.find({}, {"id": 1, "_id": 0})
        if isinstance(doc.get("id"), int)
    ]
    return max(ids, default=0) + 1


def save_user(user):
    collection = users_collection()
    if collection is None:
        payload = deepcopy(user)
        payload["email"] = _normalize_email(payload.get("email"))
        for index, existing in enumerate(_local_users):
            if existing.get("id") == payload.get("id"):
                _local_users[index] = payload
                return _serialize_user(payload)
        _local_users.append(payload)
        return _serialize_user(payload)

    collection.replace_one({"id": user["id"]}, user, upsert=True)
    return get_user_by_id(user["id"])


def create_user(user):
    collection = users_collection()
    if collection is None:
        payload = deepcopy(user)
        if not isinstance(payload.get("id"), int):
            payload["id"] = next_user_id()
        payload["email"] = _normalize_email(payload.get("email"))
        _local_users.append(payload)
        return _serialize_user(payload)

    user = deepcopy(user)
    if not isinstance(user.get("id"), int):
        user["id"] = next_user_id()
    user["email"] = _normalize_email(user.get("email"))
    collection.insert_one(user)
    return get_user_by_id(user["id"])


def save_collaboration_profile_doc(profile):
    collection = collaboration_profiles_collection()
    if collection is None:
        payload = deepcopy(profile)
        payload["email"] = _normalize_email(payload.get("email"))
        for index, existing in enumerate(_local_collaboration_profiles):
            if existing.get("user_id") == payload.get("user_id"):
                _local_collaboration_profiles[index] = payload
                return _serialize_user(payload)
        _local_collaboration_profiles.append(payload)
        return _serialize_user(payload)

    payload = deepcopy(profile)
    payload["email"] = _normalize_email(payload.get("email"))
    collection.replace_one(
        {"user_id": payload.get("user_id")},
        payload,
        upsert=True,
    )
    return _serialize_user(collection.find_one({"user_id": payload.get("user_id")}, {"_id": 0}))


def get_collaboration_profile(user_id):
    collection = collaboration_profiles_collection()
    if collection is None:
        return _serialize_user(
            next((profile for profile in _local_collaboration_profiles if profile.get("user_id") == user_id), None)
        )

    return _serialize_user(collection.find_one({"user_id": user_id}, {"_id": 0}))


def mock_sessions_collection_for_type(session_type):
    collection = mock_sessions_collection()
    if collection is None:
        return None

    return collection


def save_mock_session(session):
    collection = mock_sessions_collection()
    if collection is None:
        payload = deepcopy(session)
        for index, existing in enumerate(_local_mock_sessions):
            if existing.get("session_id") == payload.get("session_id"):
                _local_mock_sessions[index] = payload
                return _serialize_user(payload)
        _local_mock_sessions.append(payload)
        return _serialize_user(payload)

    collection.replace_one(
        {"session_id": session["session_id"]},
        session,
        upsert=True,
    )
    return _serialize_user(collection.find_one({"session_id": session["session_id"]}, {"_id": 0}))


def get_mock_session(session_id):
    collection = mock_sessions_collection()
    if collection is None:
        return _serialize_user(
            next((session for session in _local_mock_sessions if session.get("session_id") == session_id), None)
        )

    return _serialize_user(collection.find_one({"session_id": session_id}, {"_id": 0}))


def list_notifications(user_id=None):
    collection = notifications_collection()
    if collection is None:
        notifications = [
            deepcopy(notification)
            for notification in _local_notifications
            if user_id is None or notification.get("recipient_id") == user_id
        ]
        notifications.sort(key=lambda item: item.get("created_at", ""), reverse=True)
        return notifications

    query = {}
    if user_id is not None:
        query["recipient_id"] = user_id

    notifications = list(collection.find(query, {"_id": 0}))
    notifications.sort(key=lambda item: item.get("created_at", ""), reverse=True)
    return notifications


def save_notification(notification):
    collection = notifications_collection()
    if collection is None:
        payload = deepcopy(notification)
        for index, existing in enumerate(_local_notifications):
            if existing.get("id") == payload.get("id"):
                _local_notifications[index] = payload
                return deepcopy(payload)
        _local_notifications.append(payload)
        return deepcopy(payload)

    collection.replace_one(
        {"id": notification["id"]},
        notification,
        upsert=True,
    )
    return collection.find_one({"id": notification["id"]}, {"_id": 0})


def get_notification(notification_id):
    collection = notifications_collection()
    if collection is None:
        return deepcopy(next((item for item in _local_notifications if item.get("id") == notification_id), None))

    return collection.find_one({"id": notification_id}, {"_id": 0})
