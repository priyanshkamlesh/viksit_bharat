import sys
from pathlib import Path
from fastapi import FastAPI
from fastapi.responses import JSONResponse
from dotenv import load_dotenv

CURRENT_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = CURRENT_DIR.parent

if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

load_dotenv(CURRENT_DIR / ".env", override=True)

from backend.routes.interview_routes import router as interview_router
from backend.routes.mock_interview_routes import router as mock_interview_router
from backend.routes.recommendation_routes import router
from backend.routes.roadmap_route import router as job_role_router
from backend.routes.chatbot_routes import router as chatbot_router
from backend.routes.resume_routes import router as resume_router
from backend.services import get_database, get_database_error

app = FastAPI(title="AI Interview Prep Engine")


@app.get("/")
def home():
    return {"message": "Backend Running \U0001F680"}


@app.get("/health/db")
def health_db():
    database = get_database()
    if database is None:
        return JSONResponse(
            status_code=503,
            content={
                "status": "unavailable",
                "database": None,
                "error": get_database_error(),
            },
        )

    return {"status": "ok", "database": database.name, "error": None}


app.include_router(interview_router)
app.include_router(router)
app.include_router(mock_interview_router)
app.include_router(job_role_router)
app.include_router(chatbot_router)
app.include_router(resume_router)
