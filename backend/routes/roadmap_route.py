from fastapi import APIRouter
from backend.controllers.roadmap_controller import generate_full_output
from backend.models.ai_roadmap_model import generate_role_specializations

router = APIRouter()

@router.post("/full-roadmap")
def roadmap(data: dict):
    skill = data.get("skill")
    level = data.get("level")
    return generate_full_output(skill, level)


@router.post("/job-role-types")
def job_role_types(data: dict):
    role = data.get("role")
    try:
        return generate_role_specializations(role)
    except Exception as error:
        error_message = str(error)
        if "insufficient_quota" in error_message or "Error code: 429" in error_message:
            return {
                "error": "AI quota exceeded. Please update billing/quota and try again.",
                "error_code": "insufficient_quota",
                "role": str(role or "").strip(),
                "summary": "",
                "items": [],
            }
        return {
            "error": f"Job role AI generation failed: {error_message}",
            "error_code": "job_role_types_failed",
            "role": str(role or "").strip(),
            "summary": "",
            "items": [],
        }
