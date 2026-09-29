from typing import Dict, List, Optional
from pydantic import BaseModel, Field


class CareerAnalysisRequest(BaseModel):
    user_id: Optional[int] = None

    target_role: str = Field(
        min_length=2
    )

    skills: Dict[str, float] = Field(
        default_factory=dict
    )

    ats_score: Optional[float] = Field(
        default=0,
        ge=0,
        le=100
    )

    project_score: Optional[float] = Field(
        default=0,
        ge=0,
        le=100
    )

    interview_score: Optional[float] = Field(
        default=0,
        ge=0,
        le=100
    )

    assessment_score: Optional[float] = Field(
        default=0,
        ge=0,
        le=100
    )


class SkillGap(BaseModel):
    skill: str
    required: float
    current: float
    gap: float
    priority: str


class AllSkill(BaseModel):
    skill: str
    required: float
    current: float
    gap: float
    priority: str
    status: str


class CareerAnalysisResponse(BaseModel):
    target_role: str

    readiness_score: float

    matched_skills: List[dict]

    required_skills: List[dict]

    all_skills: List[AllSkill]

    skill_gaps: List[SkillGap]

    priority_gaps: List[SkillGap]

    component_scores: Dict[str, float]

    recommendations: List[str]
