from fastapi import APIRouter

from backend.models.ai_roadmap_model import generate_role_specializations, generate_tnp_topic_material


router = APIRouter()


@router.post("/job-role-types")
def job_role_types(data: dict):
    role = data.get("role")
    return generate_role_specializations(role)


@router.post("/tnp/topic-material")
def tnp_topic_material(data: dict):
    return generate_tnp_topic_material(data.get("track"), data.get("topic"))
