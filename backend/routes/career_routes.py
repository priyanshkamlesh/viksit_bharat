from fastapi import APIRouter, HTTPException

from backend.models.career_readiness_schema import (
    CareerAnalysisRequest,
    CareerAnalysisResponse
)

from backend.services.career_readiness_engine import (
    analyze_career,
    load_role_requirements
)


router = APIRouter(
    prefix="/career",
    tags=["Career Readiness"]
)


@router.get("/roles")
def get_roles():

    roles = load_role_requirements()

    return {
        "roles": list(
            roles.keys()
        )
    }


@router.post(
    "/analyze",
    response_model=CareerAnalysisResponse
)
def analyze(
    payload: CareerAnalysisRequest
):

    try:

        return analyze_career(

            target_role=payload.target_role,

            skills=payload.skills,

            ats_score=payload.ats_score,

            project_score=payload.project_score,

            interview_score=payload.interview_score,

            assessment_score=payload.assessment_score
        )

    except ValueError as error:

        raise HTTPException(
            status_code=400,
            detail=str(error)
        )

    except Exception as error:

        print(
            "Career analysis error:",
            error
        )

        raise HTTPException(
            status_code=500,
            detail="Career analysis failed."
        )