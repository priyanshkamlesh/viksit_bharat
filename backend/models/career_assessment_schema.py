from pydantic import BaseModel, Field


class CareerAssessmentGenerateRequest(BaseModel):
    target_role: str = Field(min_length=2)
    skill: str = Field(min_length=2)
    question_count: int = Field(
        default=10,
        ge=10,
        le=20
    )
    difficulty: str = Field(
        default="mixed",
        min_length=3
    )