from fastapi import APIRouter
from backend.controllers.roadmap_controller import generate_full_output

router = APIRouter()

@router.post("/full-roadmap")
def roadmap(data: dict):
    skill = data.get("skill")
    level = data.get("level")
    return generate_full_output(skill, level)
