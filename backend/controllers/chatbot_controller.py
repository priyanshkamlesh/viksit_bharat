import base64
import binascii
import html
import io
import json
import os
import re
import zipfile
import zlib
from urllib.request import Request as UrlRequest, urlopen
from urllib.error import HTTPError, URLError


SKILL_KEYWORDS = [
    "react", "javascript", "typescript", "node", "node.js", "python", "java",
    "html", "css", "sql", "mongodb", "postgresql", "mysql", "api", "rest",
    "graphql", "aws", "azure", "gcp", "docker", "kubernetes", "git", "linux",
    "machine learning", "ai", "data", "analytics", "testing", "tailwind",
    "fastapi", "django", "flask", "express", "spring", "redux",
]

ACTION_WORDS = [
    "built", "designed", "developed", "created", "implemented", "optimized",
    "improved", "reduced", "increased", "deployed", "automated", "led",
    "collaborated", "managed", "delivered", "integrated",
]

RESUME_SECTION_KEYWORDS = [
    "summary", "objective", "experience", "work experience", "employment",
    "education", "projects", "skills", "technical skills", "certifications",
    "achievements", "publications", "internship", "internships", "training",
]

RESUME_PROFILE_KEYWORDS = [
    "github", "linkedin", "portfolio", "leetcode", "hackerrank", "kaggle",
]

RESUME_ROLE_KEYWORDS = [
    "developer", "engineer", "designer", "analyst", "manager", "consultant",
    "intern", "student", "graduate", "architect", "administrator",
]


def _clean_extracted_text(text):
    return re.sub(r"\s+", " ", html.unescape(text or "")).strip()


def _decode_resume_file_data(file_data):
    if not file_data:
        return b""

    payload = str(file_data)
    if "," in payload and payload.lower().startswith("data:"):
        payload = payload.split(",", 1)[1]

    try:
        return base64.b64decode(payload, validate=False)
    except (binascii.Error, ValueError):
        return b""


def _extract_text_from_txt(file_bytes):
    for encoding in ("utf-8", "utf-16", "latin-1"):
        try:
            return file_bytes.decode(encoding)
        except UnicodeDecodeError:
            continue
    return ""


def _extract_text_from_docx(file_bytes):
    try:
        with zipfile.ZipFile(io.BytesIO(file_bytes)) as archive:
            parts = [
                name
                for name in archive.namelist()
                if name.startswith("word/") and name.endswith(".xml")
            ]
            text_parts = []
            for name in parts:
                xml = archive.read(name).decode("utf-8", errors="ignore")
                xml = re.sub(r"</w:p>|<w:br\s*/?>", "\n", xml)
                xml = re.sub(r"<[^>]+>", " ", xml)
                text_parts.append(xml)
            return "\n".join(text_parts)
    except (zipfile.BadZipFile, KeyError, OSError):
        return ""


def _decode_pdf_string(value):
    value = value.replace(r"\(", "(").replace(r"\)", ")").replace(r"\\", "\\")
    value = re.sub(r"\\[nrtbf]", " ", value)
    value = re.sub(r"\\\d{1,3}", " ", value)
    return value


def _extract_pdf_text_operators(stream_text):
    chunks = []
    chunks.extend(_decode_pdf_string(match) for match in re.findall(r"\((.*?)\)\s*Tj", stream_text, re.DOTALL))

    for array_body in re.findall(r"\[(.*?)\]\s*TJ", stream_text, re.DOTALL):
        chunks.extend(_decode_pdf_string(match) for match in re.findall(r"\((.*?)\)", array_body, re.DOTALL))

    return " ".join(chunks)


def _extract_text_from_pdf(file_bytes):
    extraction_errors = []

    try:
        from pypdf import PdfReader

        reader = PdfReader(io.BytesIO(file_bytes))
        pages = []
        for page in reader.pages:
            pages.append(page.extract_text() or "")
        text = "\n".join(pages).strip()
        if text:
            return text
    except Exception as error:
        extraction_errors.append(f"pypdf: {error}")

    try:
        from pdfminer.high_level import extract_text

        text = extract_text(io.BytesIO(file_bytes)).strip()
        if text:
            return text
    except Exception as error:
        extraction_errors.append(f"pdfminer: {error}")

    raw = file_bytes.decode("latin-1", errors="ignore")
    chunks = [_extract_pdf_text_operators(raw)]

    for match in re.finditer(rb"stream\r?\n(.*?)\r?\nendstream", file_bytes, re.DOTALL):
        stream = match.group(1).strip(b"\r\n")
        prefix = file_bytes[max(0, match.start() - 500):match.start()]
        if b"FlateDecode" in prefix:
            try:
                stream = zlib.decompress(stream)
            except zlib.error:
                continue
        stream_text = stream.decode("latin-1", errors="ignore")
        chunks.append(_extract_pdf_text_operators(stream_text))

    text = " ".join(chunk for chunk in chunks if chunk)
    if text.strip():
        return text

    text_like_words = re.findall(r"[A-Za-z]{3,}", raw)
    if len(text_like_words) >= 30:
        return raw

    return ""


def _extract_resume_text_from_file(file_name, mime_type, file_data):
    file_bytes = _decode_resume_file_data(file_data)
    if not file_bytes:
        return ""

    name = (file_name or "").lower()
    mime = (mime_type or "").lower()

    if name.endswith(".txt") or mime.startswith("text/"):
        return _extract_text_from_txt(file_bytes)
    if name.endswith(".docx") or "wordprocessingml" in mime:
        return _extract_text_from_docx(file_bytes)
    if name.endswith(".pdf") or mime == "application/pdf":
        return _extract_text_from_pdf(file_bytes)

    return ""


def _extract_json_object(text):
    payload = (text or "").strip()
    if not payload:
        return {}

    try:
        return json.loads(payload)
    except Exception:
        pass

    fenced = re.search(r"```(?:json)?\s*(\{.*?\})\s*```", payload, re.DOTALL)
    if fenced:
        return json.loads(fenced.group(1))

    first = payload.find("{")
    last = payload.rfind("}")
    if first != -1 and last != -1 and first < last:
        return json.loads(payload[first:last + 1])

    return {}


def _clamp_score(score):
    return max(0, min(100, int(round(score))))


def is_likely_resume(resume_text):
    text = str(resume_text or "")
    lower = text.lower()
    words = re.findall(r"[a-zA-Z0-9+#.-]+", lower)
    if len(words) < 50:
        return False

    has_email = bool(re.search(r"[\w.-]+@[\w.-]+\.\w+", text))
    has_phone = bool(re.search(r"(?:\+?\d[\s().-]?){8,}", text))
    has_profile_link = any(keyword in lower for keyword in RESUME_PROFILE_KEYWORDS)
    has_education_detail = bool(
        re.search(
            r"\b(b\.?tech|m\.?tech|bachelor|master|degree|university|college|cgpa|gpa|school)\b",
            lower,
        )
    )
    section_hits = {
        section
        for section in RESUME_SECTION_KEYWORDS
        if re.search(rf"\b{re.escape(section)}\b", lower)
    }
    skill_hits = {keyword for keyword in SKILL_KEYWORDS if keyword in lower}
    action_hits = {
        word
        for word in ACTION_WORDS
        if re.search(rf"\b{re.escape(word)}\b", lower)
    }
    role_hits = {
        keyword
        for keyword in RESUME_ROLE_KEYWORDS
        if re.search(rf"\b{re.escape(keyword)}\b", lower)
    }
    date_hits = len(re.findall(r"\b(?:20\d{2}|19\d{2}|jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\b", lower))
    bullet_like_lines = len(re.findall(r"(?:^|\n)\s*(?:[-*\u2022]|\d+[.)])\s+\w+", text))

    score = 0
    score += 2 if has_email else 0
    score += 2 if has_phone else 0
    score += 2 if has_profile_link else 0
    score += 2 if has_education_detail else 0
    score += min(len(section_hits), 5)
    score += min(len(skill_hits), 5)
    score += min(len(action_hits), 3)
    score += min(len(role_hits), 3)
    score += 2 if date_hits >= 2 else 0
    score += 2 if bullet_like_lines >= 3 else 0

    has_core_resume_shape = len(section_hits) >= 3 or (
        len(section_hits) >= 2 and (has_email or has_phone or has_profile_link)
    )
    has_candidate_evidence = (
        has_education_detail
        or len(role_hits) >= 1
        or len(skill_hits) >= 3
        or len(action_hits) >= 2
    )

    return score >= 9 and has_core_resume_shape and has_candidate_evidence


def _build_resume_analysis_prompt(resume_text, resume_file_name):
    resume_excerpt = (resume_text or "")[:12000]

    return f"""
You are SkillNet Coach, a resume ATS analysis specialist.
Analyze the resume text below and return ONLY valid JSON with this exact schema:
{{
  "ats_score": 0,
  "resume_feedback": {{
    "strengths": ["..."],
    "improvements": ["..."],
    "skills": ["..."]
  }}
}}

Rules:
- ats_score must be an integer between 0 and 100.
- resume_feedback.strengths should describe what is working well in the resume.
- resume_feedback.improvements should list concise, resume-specific changes.
- resume_feedback.skills should be extracted keywords or relevant technical terms.
- Do not include any extra fields.
- Do not invent information not present in the resume.

Resume file name: {resume_file_name or "none"}
Resume text:
{resume_excerpt}
"""


def _call_groq_resume_analysis(resume_text, resume_file_name=None):
    api_key = os.getenv("GROQ_API_KEY", "").strip().strip('"').strip("'")
    if not api_key:
        raise RuntimeError("GROQ_API_KEY is not configured")

    models = _parse_models(
        os.getenv("GROQ_CHATBOT_MODEL") or os.getenv("GROQ_MODEL") or "llama-3.3-70b-versatile",
        [
            "llama-3.3-70b-versatile",
            "llama-3.1-8b-instant",
            "openai/gpt-oss-20b",
        ],
    )

    base_url = os.getenv("GROQ_BASE_URL", "https://api.groq.com/openai/v1").strip().rstrip("/")
    url = f"{base_url}/chat/completions"
    last_error = None

    for model in models:
        body = {
            "model": model,
            "messages": [
                {"role": "system", "content": "You are SkillNet Coach. Return strict JSON only."},
                {"role": "user", "content": _build_resume_analysis_prompt(resume_text, resume_file_name)},
            ],
            "temperature": 0.1,
            "response_format": {"type": "json_object"},
        }

        request = UrlRequest(
            url,
            data=json.dumps(body).encode("utf-8"),
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
            },
            method="POST",
        )

        try:
            with urlopen(request, timeout=30) as response:
                payload = json.loads(response.read().decode("utf-8"))
            content = payload["choices"][0]["message"]["content"]
            result = _extract_json_object(content)
            if result.get("ats_score") is None:
                raise ValueError("Model response missing ats_score")
            result["provider"] = "groq"
            result["model"] = model
            return result
        except Exception as error:
            last_error = error
            continue

    raise RuntimeError(f"Resume analysis failed: {last_error}")


def analyze_resume_with_model(resume_text, resume_file_name=None):
    """
    Analyze resume using BAAI/bge semantic ATS scoring as primary engine.
    Falls back to Groq LLM if the semantic analyzer is unavailable.
    """
    try:
        from backend.services.ats_analyzer import compute_ats_score

        result = compute_ats_score(resume_text)
        return {
            "ats_score": result["ats_score"],
            "resume_feedback": {
                "strengths": result["strengths"],
                "improvements": result["improvements"],
                "skills": result["extracted_skills"],
            },
            "dimension_scores": result.get("dimension_scores", {}),
            "provider": "baai/bge-local",
            "model": "BAAI/bge-small-en-v1.5",
        }
    except Exception as semantic_error:
        # Fall back to Groq LLM if local model fails
        try:
            return _call_groq_resume_analysis(resume_text, resume_file_name)
        except Exception as groq_error:
            raise RuntimeError(
                f"ATS analysis failed: semantic={semantic_error}, groq={groq_error}"
            ) from groq_error


def _fallback_answer(message, resume_text=""):
    lower_message = (message or "").lower()

    if resume_text:
        # Even when the AI model is unavailable, try to give a helpful answer
        # based on the user's question rather than a generic error.
        if any(word in lower_message for word in ["improve", "better", "increase", "boost", "raise", "enhance"]):
            answer = (
                "Here are ways to improve your resume:\n"
                "1. Add quantifiable achievements (e.g. 'Increased performance by 30%' instead of 'Worked on performance').\n"
                "2. Use strong action verbs like built, designed, implemented, optimized, led, deployed.\n"
                "3. Ensure clear section headings (Summary, Skills, Experience, Projects, Education).\n"
                "4. Include relevant keywords from your target job descriptions.\n"
                "5. Add links to your GitHub, LinkedIn, or portfolio.\n"
                "6. Keep bullet points to 1-2 lines and remove filler words."
            )
        elif any(word in lower_message for word in ["skill", "skills", "technologies", "tools", "stack", "tech"]):
            answer = (
                "Focus on adding both technical skills (programming languages, frameworks, tools) "
                "and soft skills (leadership, communication, problem-solving). List them in a dedicated "
                "Skills section. Tailor the skills to match the job descriptions you're targeting."
            )
        elif any(word in lower_message for word in ["format", "formatting", "structure", "layout", "design", "template"]):
            answer = (
                "For optimal ATS scoring, use a clean single-column layout with clear headings. "
                "Avoid tables, images, and complex formatting. Use standard fonts like Arial or Calibri. "
                "Save as PDF or DOCX for best compatibility. Keep your resume to 1-2 pages."
            )
        elif any(word in lower_message for word in ["score", "ats", "score"]):
            answer = (
                "ATS scores are based on keyword relevance, formatting clarity, content structure, "
                "and measurable impact. Review the improvement tips shown in the right panel for "
                "specific areas to enhance. A score above 75 is considered good."
            )
        elif any(word in lower_message for word in ["interview", "prepare", "preparation"]):
            answer = (
                "For interviews, prepare three layers: technical basics, project explanation, and behavioral stories. "
                "Practice explaining one project with problem, stack, architecture, challenges, and measurable result. "
                "For behavioral answers, use STAR: situation, task, action, result."
            )
        elif any(word in lower_message for word in ["roadmap", "career", "path", "learn", "learning", "study"]):
            answer = (
                "To build a strong career path, start with fundamentals in your target domain, "
                "build progressively harder projects, contribute to open source, and create a portfolio. "
                "Tell me your target role for a more specific roadmap."
            )
        elif any(word in lower_message for word in ["project", "projects", "portfolio"]):
            answer = (
                "Include 2-4 significant projects on your resume. For each project, describe the problem "
                "you solved, the technologies used, your specific contributions, and measurable results. "
                "Link to live demos or GitHub repositories when possible."
            )
        else:
            answer = (
                "I can help answer questions about your resume, career development, interviews, and skill-building. "
                "Could you provide more specific details about what you'd like to know? "
                "For example, ask about: improving your ATS score, adding skills, interview preparation, or career roadmaps."
            )
    elif any(word in lower_message for word in ["resume", "ats", "score"]):
        answer = "Upload or paste your resume text and I will analyze it with the configured ATS model."
    elif "full stack" in lower_message or "fullstack" in lower_message:
        answer = (
            "For full stack, learn in this order: HTML/CSS/JavaScript, React, backend APIs, databases, authentication, "
            "then deployment. Build one complete project after each stage, such as a task app, job tracker, or portfolio "
            "with login and CRUD. Keep notes on what broke and how you fixed it because that becomes interview material."
        )
    elif "interview" in lower_message:
        answer = (
            "For interviews, prepare three layers: technical basics, project explanation, and behavioral stories. "
            "Practice explaining one project with problem, stack, architecture, challenges, and measurable result. "
            "For behavioral answers, use STAR: situation, task, action, result."
        )
    else:
        answer = (
            "I can help clear doubts about roadmaps, interviews, projects, resumes, and career preparation. "
            "Ask your question with your target role or current skill level for a sharper answer."
        )

    return {
        "answer": answer,
        "ats_score": None,
        "resume_feedback": None,
        "provider": "local-fallback",
    }


def _as_list(value):
    if isinstance(value, list):
        return [str(item) for item in value if str(item).strip()]
    return []


def _normalize_resume_result(result, resume_text):
    if not resume_text:
        return result

    feedback = result.get("resume_feedback")
    if not isinstance(feedback, dict):
        feedback = {
            "strengths": _as_list(result.get("strengths")),
            "improvements": _as_list(result.get("improvements")),
            "skills": _as_list(result.get("skills")),
        }

    try:
        ats_score = result.get("ats_score")
        if ats_score is None:
            raise ValueError("missing score")
        result["ats_score"] = _clamp_score(float(ats_score))
    except (TypeError, ValueError):
        result["ats_score"] = 0

    strengths = _as_list(feedback.get("strengths"))
    improvements = _as_list(feedback.get("improvements"))
    skills = _as_list(feedback.get("skills"))

    result["resume_feedback"] = {
        "strengths": strengths[:5],
        "improvements": improvements[:6],
        "skills": skills[:12],
    }

    if not result.get("answer"):
        result["answer"] = (
            f"Your estimated ATS score is {result['ats_score']}/100. "
            "Review the strengths and improvement tips below."
        )

    return result


def _parse_models(raw_models, default_models):
    seen = set()
    models = []
    candidates = []
    if raw_models:
        candidates.extend(part.strip() for part in raw_models.split(","))
    candidates.extend(default_models)

    for model in candidates:
        if not model:
            continue
        key = model.lower()
        if key in seen:
            continue
        seen.add(key)
        models.append(model)
    return models


def _build_prompt(message, history, resume_text, resume_file_name):
    recent_history = [
        {"role": item.role, "content": item.content[:1200]}
        for item in (history or [])[-8:]
    ]
    resume_excerpt = (resume_text or "")[:7000]

    return f"""
You are SkillNet Coach, a concise career-prep chatbot.

User message:
{message}

Recent chat history JSON:
{json.dumps(recent_history, ensure_ascii=False)}

Resume file name: {resume_file_name or "none"}
Resume text excerpt:
{resume_excerpt or "No resume uploaded."}

Return ONLY valid JSON with this exact shape:
{{
  "answer": "Helpful answer in 2-5 short paragraphs or bullets.",
  "ats_score": 0,
  "resume_feedback": {{
    "strengths": ["..."],
    "improvements": ["..."],
    "skills": ["..."]
  }}
}}

Rules:
- If no resume text is provided, use null for ats_score and resume_feedback.
- If resume text is provided, compute an ATS score from 0 to 100 based on resume structure, keywords, action verbs, measurable impact, sections, formatting, and contact/profile details.
- ATS feedback should include keywords, measurable impact, formatting/sections, project clarity, and contact/profile links.
- For general doubts, answer directly and practically.
- Do not invent hidden resume content.
"""


def _read_http_error(error):
    try:
        body = error.read().decode("utf-8")
    except Exception:
        body = ""

    if not body:
        return str(error)

    try:
        payload = json.loads(body)
        groq_error = payload.get("error")
        if isinstance(groq_error, dict):
            return groq_error.get("message") or body
        return body
    except Exception:
        return body


def _call_groq_once(model, message, history, resume_text, resume_file_name):
    api_key = os.getenv("GROQ_API_KEY", "").strip().strip('"').strip("'")
    if not api_key:
        raise RuntimeError("GROQ_API_KEY is not configured")

    base_url = os.getenv("GROQ_BASE_URL", "https://api.groq.com/openai/v1").strip().rstrip("/")
    url = f"{base_url}/chat/completions"
    body = {
        "model": model,
        "messages": [
            {
                "role": "system",
                "content": "You are SkillNet Coach. Return strict JSON only.",
            },
            {
                "role": "user",
                "content": _build_prompt(message, history, resume_text, resume_file_name),
            },
        ],
        "temperature": 0.3,
        "response_format": {"type": "json_object"},
    }
    request = UrlRequest(
        url,
        data=json.dumps(body).encode("utf-8"),
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        },
        method="POST",
    )

    try:
        with urlopen(request, timeout=30) as response:
            payload = json.loads(response.read().decode("utf-8"))
    except HTTPError as error:
        raise RuntimeError(f"Groq {error.code}: {_read_http_error(error)}") from error

    content = payload["choices"][0]["message"]["content"]
    result = _extract_json_object(content)
    if not result.get("answer"):
        raise ValueError("Groq response did not include an answer")
    result["provider"] = "groq"
    result["model"] = model
    return result


def _call_groq(message, history, resume_text, resume_file_name):
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        raise RuntimeError("GROQ_API_KEY is not configured")

    models = _parse_models(
        os.getenv("GROQ_CHATBOT_MODEL") or os.getenv("GROQ_MODEL") or "llama-3.3-70b-versatile",
        [
            "llama-3.3-70b-versatile",
            "llama-3.1-8b-instant",
            "openai/gpt-oss-20b",
        ],
    )
    errors = []

    for model in models:
        try:
            return _call_groq_once(model, message, history, resume_text, resume_file_name)
        except Exception as error:
            errors.append(f"{model}: {error}")

    raise RuntimeError(" | ".join(errors))


def handle_chatbot_message(payload):
    message = (payload.message or "").strip()
    resume_text = (payload.resume_text or "").strip()
    extraction_error = None
    resume_validation_error = None
    if not resume_text and payload.resume_file_data:
        resume_text = _clean_extracted_text(
            _extract_resume_text_from_file(
                payload.resume_file_name,
                payload.resume_mime_type,
                payload.resume_file_data,
            )
        )
        if not resume_text:
            extraction_error = (
                "Could not extract readable text from this resume file. "
                "If it is a scanned/image PDF, export it as a text-based PDF or upload DOCX/TXT."
            )
        elif not is_likely_resume(resume_text):
            resume_validation_error = (
                "This file does not look like a resume, so I cannot calculate an ATS score for it. "
                "Please upload a resume with clear sections like Skills, Projects, Experience, and Education."
            )
            resume_text = ""

    if not message and not resume_text:
        return {
            "answer": "Ask me a doubt or upload a readable resume file first. I can analyze TXT, DOCX, and text-based PDF resumes.",
            "ats_score": None,
            "resume_feedback": None,
            "provider": "local-fallback",
            "extraction_error": extraction_error,
        }

    if extraction_error or resume_validation_error:
        answer = extraction_error or resume_validation_error
        return {
            "answer": answer,
            "ats_score": None,
            "resume_feedback": None,
            "provider": "local-fallback",
            "extraction_error": answer,
        }

    try:
        result = _call_groq(message, payload.history, resume_text, payload.resume_file_name)
    except (HTTPError, URLError, TimeoutError, RuntimeError, ValueError, KeyError, json.JSONDecodeError) as error:
        result = _fallback_answer(message, resume_text)
        if os.getenv("AI_PROVIDER_DEBUG", "false").lower() == "true":
            result["error"] = str(error)
        # When Groq fails but resume text is available, compute ATS score locally.
        if resume_text:
            try:
                from backend.services.ats_analyzer import compute_ats_score
                ats_result = compute_ats_score(resume_text)
                result["ats_score"] = ats_result["ats_score"]
                result["resume_feedback"] = {
                    "strengths": ats_result["strengths"],
                    "improvements": ats_result["improvements"],
                    "skills": ats_result["extracted_skills"],
                }
                result["provider"] = "baai/bge-local"
            except Exception:
                pass  # Silently keep fallback answer without ATS data.

    return _normalize_resume_result(result, resume_text)
