import json
import os
from urllib.error import HTTPError, URLError
from urllib.request import Request as UrlRequest, urlopen

from backend.controllers.chatbot_controller import is_likely_resume
from backend.services.ats_analyzer import SENTENCE_TRANSFORMER_MODEL_NAME, compute_ats_score
from backend.utils.resume_parser import parse_resume_details


def analyze_resume(resume_text):
    """
    Analyze resume and return ATS score with detailed feedback,
    along with extracted structured details from the resume.
    """
    if not resume_text or not resume_text.strip():
        return {
            "ats_score": 0,
            "strengths": ["Upload a resume to get started."],
            "improvements": ["Add resume content to receive ATS analysis and improvement tips."],
            "skills": [],
            "model_name": SENTENCE_TRANSFORMER_MODEL_NAME,
            "scoring_method": "sentence-transformer-semantic-similarity",
            "model_available": False,
            "dimension_scores": {},
            "extracted_details": {},
        }

    if not is_likely_resume(resume_text):
        return {
            "ats_score": 0,
            "strengths": [],
            "improvements": [
                "This document does not look like a resume. Upload a resume with clear Skills, Projects, Experience, and Education sections."
            ],
            "skills": [],
            "model_name": SENTENCE_TRANSFORMER_MODEL_NAME,
            "scoring_method": "sentence-transformer-semantic-similarity",
            "model_available": False,
            "dimension_scores": {},
            "extracted_details": {},
        }

    result = compute_ats_score(resume_text)

    # Extract structured details from the resume text
    extracted_details = extract_resume_details(resume_text)

    return {
        "ats_score": result.get("ats_score", 0),
        "strengths": result.get("strengths", []),
        "improvements": result.get("improvements", []),
        "skills": result.get("extracted_skills", []),
        "model_name": result.get("model_name", SENTENCE_TRANSFORMER_MODEL_NAME),
        "scoring_method": result.get("scoring_method", "sentence-transformer-semantic-similarity"),
        "model_available": result.get("model_available", False),
        "dimension_scores": result.get("dimension_scores", {}),
        "extracted_details": extracted_details,
    }


def extract_resume_details(resume_text):
    """
    Extract structured fields (name, email, phone, sections) from a resume text.
    Uses regex-based parsing defined in backend.utils.resume_parser.
    """
    if not resume_text or not resume_text.strip():
        return {}
    return parse_resume_details(resume_text)


def _resume_generation_prompt(payload):
    source_resume_text = (payload.source_resume_text or "").strip()
    return f"""
You are an expert ATS resume writer.
Create a polished, ATS-friendly resume in plain text for the candidate below.

Candidate:
- Full name: {payload.full_name or "Infer from previous resume if available"}
- Email: {payload.email or "Not provided"}
- Phone: {payload.phone or "Not provided"}
- Location: {payload.location or "Not provided"}
- LinkedIn: {payload.linkedin_url or "Not provided"}
- GitHub/Portfolio: {payload.github_url or "Not provided"}
- Target role: {payload.target_role or "Infer a suitable target role from previous resume if available"}
- Existing summary: {payload.summary or "Not provided"}
- Skills: {payload.skills or "Not provided"}
- Education: {payload.education or "Not provided"}
- Experience: {payload.experience or "Not provided"}
- Projects: {payload.projects or "Not provided"}
- Certifications: {payload.certifications or "Not provided"}

Previous resume content:
{source_resume_text[:12000] if source_resume_text else "Not provided"}

Rules:
- Return only the resume text, no commentary.
- Use clear sections: Header, Summary, Skills, Experience, Projects, Education, Certifications.
- Use concise bullet points with strong action verbs.
- Do not invent company names, degrees, certifications, dates, metrics, links, or contact details.
- Preserve useful real details from the previous resume, but rewrite weak wording into stronger ATS-friendly bullets.
- If a section has no data, omit it.
- Keep it suitable for a one-page technical resume.
""".strip()


def generate_resume_with_ollama(payload):
    model = os.getenv("OLLAMA_RESUME_MODEL", "phi3").strip() or "phi3"
    base_url = os.getenv("OLLAMA_BASE_URL", "http://127.0.0.1:11434").strip().rstrip("/")
    url = f"{base_url}/api/generate"
    body = {
        "model": model,
        "prompt": _resume_generation_prompt(payload),
        "stream": False,
        "options": {
            "temperature": 0.25,
            "top_p": 0.9,
        },
    }

    request = UrlRequest(
        url,
        data=json.dumps(body).encode("utf-8"),
        headers={"Content-Type": "application/json"},
        method="POST",
    )

    try:
        with urlopen(request, timeout=120) as response:
            result = json.loads(response.read().decode("utf-8"))
    except HTTPError as error:
        detail = error.read().decode("utf-8", errors="ignore") or str(error)
        raise RuntimeError(f"Ollama returned {error.code}: {detail}") from error
    except URLError as error:
        raise RuntimeError(
            "Ollama is not reachable. Start Ollama and run `ollama pull phi3` before generating a resume."
        ) from error

    generated_resume = (result.get("response") or "").strip()
    if not generated_resume:
        raise RuntimeError("Ollama did not return generated resume text.")

    return {
        "generated_resume": generated_resume,
        "model_name": model,
        "provider": "ollama",
    }
