from typing import List, Dict

from fastapi import APIRouter
from pydantic import BaseModel, Field

from backend.services.career_roadmap_engine import (
    generate_career_roadmap
)


router = APIRouter(
    prefix="/career",
    tags=["Career Roadmap"]
)


class CareerRoadmapRequest(BaseModel):
    target_role: str = Field(
        min_length=2
    )

    skill_gaps: List[Dict] = Field(
        default_factory=list
    )


@router.post("/roadmap")
def create_career_roadmap(
    payload: CareerRoadmapRequest
):

    return generate_career_roadmap(
        target_role=payload.target_role,
        skill_gaps=payload.skill_gaps
    )