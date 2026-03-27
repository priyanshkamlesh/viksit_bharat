"""Backend services."""
import json
import os
from pathlib import Path
from copy import deepcopy

try:
    from pymongo import MongoClient
    from pymongo.errors import PyMongoError
    from pymongo.uri_parser import parse_uri
except ImportError:  # pragma: no cover
    MongoClient = None
    PyMongoError = Exception
    parse_uri = None


PROJECT_ROOT = Path(__file__).resolve().parent.parent
USERS_SEED_PATH = PROJECT_ROOT / "data" / "users.json"

_client = None
_database = None
_last_mongo_error = None


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

    mongo_uri = os.getenv("MONGODB_URI")
    mongo_db_name = os.getenv("MONGODB_DB") or _database_name_from_uri(mongo_uri) or "Bengalore_Hackathon"

    try:
        _client = MongoClient(mongo_uri, serverSelectionTimeoutMS=3000)
        _client.admin.command("ping")
        _database = _client[mongo_db_name]
        _last_mongo_error = None
        return _database
    except PyMongoError as exc:
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


def seed_users_if_needed():
    collection = users_collection()
    if collection is None:
        return False

    if collection.count_documents({}) > 0:
        return True

    if not USERS_SEED_PATH.exists():
        return False

    with USERS_SEED_PATH.open("r", encoding="utf-8") as file:
        users = json.load(file)

    if not users:
        return False

    collection.insert_many(users)
    return True


def list_users():
    collection = users_collection()
    if collection is None:
        raise RuntimeError("MongoDB is not available")

    seed_users_if_needed()
    return [_serialize_user(user) for user in collection.find({}, {"_id": 0})]


def get_user_by_id(user_id):
    collection = users_collection()
    if collection is None:
        raise RuntimeError("MongoDB is not available")

    seed_users_if_needed()
    return _serialize_user(collection.find_one({"id": user_id}, {"_id": 0}))


def get_user_by_email(email):
    normalized_email = _normalize_email(email)
    if not normalized_email:
        return None

    collection = users_collection()
    if collection is None:
        raise RuntimeError("MongoDB is not available")

    seed_users_if_needed()
    return _serialize_user(collection.find_one({"email": normalized_email}, {"_id": 0}))


def next_user_id():
    collection = users_collection()
    if collection is None:
        raise RuntimeError("MongoDB is not available")

    seed_users_if_needed()
    ids = [
        doc.get("id")
        for doc in collection.find({}, {"id": 1, "_id": 0})
        if isinstance(doc.get("id"), int)
    ]
    return max(ids, default=0) + 1


def save_user(user):
    collection = users_collection()
    if collection is None:
        raise RuntimeError("MongoDB is not available")

    collection.replace_one({"id": user["id"]}, user, upsert=True)
    return get_user_by_id(user["id"])


def create_user(user):
    collection = users_collection()
    if collection is None:
        raise RuntimeError("MongoDB is not available")

    user = deepcopy(user)
    if not isinstance(user.get("id"), int):
        user["id"] = next_user_id()
    user["email"] = _normalize_email(user.get("email"))
    collection.insert_one(user)
    return get_user_by_id(user["id"])


def save_collaboration_profile_doc(profile):
    collection = collaboration_profiles_collection()
    if collection is None:
        raise RuntimeError("MongoDB is not available")

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
        raise RuntimeError("MongoDB is not available")

    return _serialize_user(collection.find_one({"user_id": user_id}, {"_id": 0}))


def mock_sessions_collection_for_type(session_type):
    collection = mock_sessions_collection()
    if collection is None:
        return None

    return collection


def save_mock_session(session):
    collection = mock_sessions_collection()
    if collection is None:
        raise RuntimeError("MongoDB is not available")

    collection.replace_one(
        {"session_id": session["session_id"]},
        session,
        upsert=True,
    )
    return _serialize_user(collection.find_one({"session_id": session["session_id"]}, {"_id": 0}))


def get_mock_session(session_id):
    collection = mock_sessions_collection()
    if collection is None:
        return None

    return _serialize_user(collection.find_one({"session_id": session_id}, {"_id": 0}))


def list_notifications(user_id=None):
    collection = notifications_collection()
    if collection is None:
        raise RuntimeError("MongoDB is not available")

    query = {}
    if user_id is not None:
        query["recipient_id"] = user_id

    notifications = list(collection.find(query, {"_id": 0}))
    notifications.sort(key=lambda item: item.get("created_at", ""), reverse=True)
    return notifications


def save_notification(notification):
    collection = notifications_collection()
    if collection is None:
        raise RuntimeError("MongoDB is not available")

    collection.replace_one(
        {"id": notification["id"]},
        notification,
        upsert=True,
    )
    return collection.find_one({"id": notification["id"]}, {"_id": 0})


def get_notification(notification_id):
    collection = notifications_collection()
    if collection is None:
        raise RuntimeError("MongoDB is not available")

    return collection.find_one({"id": notification_id}, {"_id": 0})
