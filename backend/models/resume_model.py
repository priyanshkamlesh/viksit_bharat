from pydantic import BaseModel
from typing import Dict, Optional, List


class ResumeAnalysisRequest(BaseModel):
    resume_text: Optional[str] = None
    resume_file_name: Optional[str] = None
    resume_mime_type: Optional[str] = None
    resume_file_data: Optional[str] = None


class ResumeAnalysisResponse(BaseModel):
    ats_score: int
    strengths: List[str] = []
    improvements: List[str] = []
    skills: List[str] = []
    model_name: Optional[str] = None
    scoring_method: Optional[str] = None
    model_available: bool = False
    dimension_scores: Dict[str, float] = {}
    extracted_details: Dict[str, str] = {}


class ResumeGenerateRequest(BaseModel):
    full_name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    location: Optional[str] = None
    linkedin_url: Optional[str] = None
    github_url: Optional[str] = None
    target_role: Optional[str] = None
    summary: Optional[str] = None
    skills: Optional[str] = None
    education: Optional[str] = None
    experience: Optional[str] = None
    projects: Optional[str] = None
    certifications: Optional[str] = None
    source_resume_text: Optional[str] = None
    source_resume_file_name: Optional[str] = None
    source_resume_mime_type: Optional[str] = None
    source_resume_file_data: Optional[str] = None


class ResumeGenerateResponse(BaseModel):
    generated_resume: str
    model_name: str
    provider: str = "ollama"


class ResumeExtractResponse(BaseModel):
    full_name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    location: Optional[str] = None
    linkedin_url: Optional[str] = None
    github_url: Optional[str] = None
    target_role: Optional[str] = None
    summary: Optional[str] = None
    skills: Optional[str] = None
    education: Optional[str] = None
    experience: Optional[str] = None
    projects: Optional[str] = None
    certifications: Optional[str] = None
    raw_text: Optional[str] = None
