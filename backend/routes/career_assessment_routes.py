from fastapi import APIRouter

from backend.models.career_assessment_schema import (
    CareerAssessmentGenerateRequest
)

from backend.services.career_assessment_service import (
    generate_career_assessment
)


router = APIRouter(
    prefix="/career/assessment",
    tags=["Career Assessment"]
)


@router.post("/generate")
def generate_assessment(
    payload: CareerAssessmentGenerateRequest
):

    return generate_career_assessment(
        target_role=payload.target_role,
        skill=payload.skill,
        question_count=payload.question_count,
        difficulty=payload.difficulty,
    )