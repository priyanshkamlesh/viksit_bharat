from typing import List, Optional, Union

from fastapi import APIRouter
from pydantic import BaseModel, Field

from backend.services.career_evidence_service import (
    build_career_evidence
)


router = APIRouter(
    prefix="/career",
    tags=["Career Evidence"]
)


# =========================================================
# SKILL INPUT
# =========================================================

class SkillInput(BaseModel):

    name: str

    level: Optional[str] = None


# =========================================================
# CAREER EVIDENCE REQUEST
# =========================================================

class CareerEvidenceRequest(BaseModel):

    resume_skills: List[
        Union[str, SkillInput]
    ] = Field(
        default_factory=list
    )

    project_skills: List[
        Union[str, SkillInput]
    ] = Field(
        default_factory=list
    )

    github_skills: List[
        Union[str, SkillInput]
    ] = Field(
        default_factory=list
    )

    projects: List[dict] = Field(
        default_factory=list
    )

    mock_tests: List[dict] = Field(
        default_factory=list
    )

    ats_score: Optional[float] = 0

    interview_score: Optional[float] = 0


# =========================================================
# ENDPOINT
# =========================================================

@router.post("/evidence")
def get_career_evidence(
    payload: CareerEvidenceRequest
):

    return build_career_evidence(

        resume_skills=payload.resume_skills,

        project_skills=payload.project_skills,

        github_skills=payload.github_skills,

        projects=payload.projects,

        mock_tests=payload.mock_tests,

        ats_score=payload.ats_score,

        interview_score=payload.interview_score
    )