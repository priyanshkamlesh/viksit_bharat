from fastapi import APIRouter, HTTPException
from backend.models.resume_model import (
    ResumeAnalysisRequest,
    ResumeAnalysisResponse,
    ResumeExtractResponse,
    ResumeGenerateRequest,
    ResumeGenerateResponse,
)
from backend.controllers.resume_controller import analyze_resume, extract_resume_details, generate_resume_with_ollama
from backend.controllers.chatbot_controller import _clean_extracted_text, _extract_resume_text_from_file

router = APIRouter(prefix="/resume", tags=["resume"])


def _extract_text_from_request(file_name, mime_type, file_data):
    """Helper to extract plain text from uploaded resume file data."""
    if not file_data:
        return ""
    return _clean_extracted_text(
        _extract_resume_text_from_file(file_name, mime_type, file_data)
    )


@router.post("/analyze", response_model=ResumeAnalysisResponse)
def analyze_resume_endpoint(request: ResumeAnalysisRequest):
    """
    Analyze resume and return ATS score with detailed feedback.
    Also returns extracted structured details from the resume.
    
    - **resume_text**: The resume content to analyze
    - **resume_file_data**: Optional file data for PDF/DOCX/TXT resumes
    """
    try:
        resume_text = request.resume_text or ""
        if not resume_text and request.resume_file_data:
            resume_text = _extract_text_from_request(
                request.resume_file_name,
                request.resume_mime_type,
                request.resume_file_data,
            )
        result = analyze_resume(resume_text)
        return ResumeAnalysisResponse(**result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/extract", response_model=ResumeExtractResponse)
def extract_resume_endpoint(request: ResumeAnalysisRequest):
    """
    Extract structured details (name, email, phone, sections) from a resume file or text.
    Returns parsed fields ready to use in the resume creation form.
    
    - **resume_text**: Plain text resume content
    - **resume_file_data**: File data for PDF/DOCX/TXT resumes (alternative to resume_text)
    """
    try:
        resume_text = request.resume_text or ""
        if not resume_text and request.resume_file_data:
            resume_text = _extract_text_from_request(
                request.resume_file_name,
                request.resume_mime_type,
                request.resume_file_data,
            )

        if not resume_text or not resume_text.strip():
            raise HTTPException(
                status_code=422,
                detail="Provide resume text or upload a resume file to extract details.",
            )

        details = extract_resume_details(resume_text)
        details["raw_text"] = resume_text
        return ResumeExtractResponse(**details)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/generate", response_model=ResumeGenerateResponse)
def generate_resume_endpoint(request: ResumeGenerateRequest):
    """
    Generate an ATS-friendly resume using local Ollama + Phi-3.
    If a source resume file is provided and manual fields are empty,
    auto-extracts structured details from the uploaded file.
    """
    try:
        source_resume_text = request.source_resume_text or ""
        if not source_resume_text and request.source_resume_file_data:
            source_resume_text = _extract_text_from_request(
                request.source_resume_file_name,
                request.source_resume_mime_type,
                request.source_resume_file_data,
            )

        has_manual_content = any(
            (value or "").strip()
            for value in (
                request.full_name,
                request.target_role,
                request.summary,
                request.skills,
                request.education,
                request.experience,
                request.projects,
                request.certifications,
            )
        )
        if not source_resume_text and not has_manual_content:
            raise HTTPException(
                status_code=422,
                detail="Upload a previous resume or enter resume details before generating.",
            )

        request.source_resume_text = source_resume_text

        # Auto-extract structured details from source resume when manual fields are empty
        if source_resume_text and not has_manual_content:
            extracted = extract_resume_details(source_resume_text)
            if extracted:
                request.full_name = request.full_name or extracted.get("full_name")
                request.email = request.email or extracted.get("email")
                request.phone = request.phone or extracted.get("phone")
                request.location = request.location or extracted.get("location")
                request.linkedin_url = request.linkedin_url or extracted.get("linkedin_url")
                request.github_url = request.github_url or extracted.get("github_url")
                request.summary = request.summary or extracted.get("summary")
                request.skills = request.skills or extracted.get("skills")
                request.education = request.education or extracted.get("education")
                request.experience = request.experience or extracted.get("experience")
                request.projects = request.projects or extracted.get("projects")
                request.certifications = request.certifications or extracted.get("certifications")

        result = generate_resume_with_ollama(request)
        return ResumeGenerateResponse(**result)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=503, detail=str(e))
