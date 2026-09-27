"""
Semantic ATS Resume Scoring Engine
Uses BAAI/bge-small-en-v1.5 embeddings locally via sentence-transformers
to compute cosine similarity between resumes and ideal ATS profiles.
"""

import logging
import math
import os
import re
from typing import List, Dict, Tuple, Optional

import numpy as np

logger = logging.getLogger("ats_analyzer")

_embedding_model = None
_embedding_model_load_error = None
SENTENCE_TRANSFORMER_MODEL_NAME = os.getenv("ATS_SENTENCE_TRANSFORMER_MODEL", "BAAI/bge-small-en-v1.5")

# ── Reference "ideal ATS resume" profiles ──────────────────────────────────
# Each profile describes what a strong ATS score requires in a specific dimension.

ATS_REFERENCE_PROFILES: Dict[str, str] = {
    "structure": (
        "A professional resume with clear sections: Summary, Skills, Work Experience, "
        "Projects, Education, Certifications. Uses consistent formatting with bullet points, "
        "clear headings, and logical flow. Contact information includes full name, email, "
        "phone number, LinkedIn profile, GitHub portfolio, and location."
    ),
    "action_verbs": (
        "Uses strong action verbs: built, designed, developed, implemented, optimized, "
        "led, managed, deployed, automated, integrated, delivered, reduced, increased, "
        "engineered, architected, launched, scaled, orchestrated, streamlined."
    ),
    "measurable_impact": (
        "Quantifies achievements with numbers and metrics: percentages, dollar amounts, "
        "time saved, users served, latency reduced, revenue generated, cost cut, "
        "team size, project scale. Every bullet has concrete measurable results."
    ),
    "technical_skills": (
        "Lists relevant technical skills: Python, Java, JavaScript, TypeScript, React, "
        "Node.js, SQL, Docker, Kubernetes, AWS, GCP, Azure, Git, CI/CD, REST APIs, "
        "GraphQL, Machine Learning, Data Analysis, MongoDB, PostgreSQL, Redis, "
        "Linux, FastAPI, Django, Flask, Spring Boot, microservices."
    ),
    "brevity_clarity": (
        "Concise bullet points, one to two lines each. No fluff or filler words. "
        "Resume is one to two pages maximum. Every word adds value. "
        "No personal pronouns. Consistent tense. No spelling or grammar errors."
    ),
    "keyword_match": (
        "Resume contains keywords matching target job descriptions. Includes both "
        "hard skills and soft skills relevant to the role. Uses industry-standard "
        "terminology and frameworks. ATS-optimized with relevant buzzwords naturally "
        "integrated into experience descriptions."
    ),
    "experience_depth": (
        "Describes work experience with context (company, role, dates), responsibilities, "
        "and achievements. Shows career progression and increasing responsibility. "
        "Includes relevant internships, freelance work, and open-source contributions."
    ),
    "education_certs": (
        "Lists degrees with institution name, graduation year, GPA if strong. "
        "Includes relevant certifications (AWS, Azure, Kubernetes, etc.). "
        "Shows continuous learning through courses and training."
    ),
}

# Weights for each dimension (sum = 1.0)
DIMENSION_WEIGHTS = {
    "structure": 0.10,
    "action_verbs": 0.12,
    "measurable_impact": 0.18,
    "technical_skills": 0.18,
    "brevity_clarity": 0.10,
    "keyword_match": 0.14,
    "experience_depth": 0.10,
    "education_certs": 0.08,
}

# ── Skill taxonomy for extraction via semantic search ────────────────────
SKILL_TAXONOMY = [
    # Languages
    "Python", "Java", "JavaScript", "TypeScript", "C++", "C#", "Go", "Rust",
    "Ruby", "PHP", "Swift", "Kotlin", "Scala", "R", "MATLAB", "Dart",
    "HTML", "CSS", "SQL", "Bash", "Shell scripting", "Perl",
    # Frontend
    "React", "Angular", "Vue.js", "Next.js", "Svelte", "Redux", "Tailwind CSS",
    "Bootstrap", "Material UI", "jQuery", "Webpack", "Vite", "SASS",
    # Backend
    "Node.js", "Express", "FastAPI", "Django", "Flask", "Spring Boot",
    "ASP.NET", "Laravel", "Ruby on Rails", "GraphQL", "REST APIs",
    "gRPC", "Microservices", "Serverless",
    # Databases
    "MongoDB", "PostgreSQL", "MySQL", "Redis", "Elasticsearch", "DynamoDB",
    "Cassandra", "SQLite", "Oracle", "Firebase", "Supabase",
    # Cloud & DevOps
    "AWS", "Azure", "GCP", "Docker", "Kubernetes", "Terraform", "Jenkins",
    "GitHub Actions", "CI/CD", "Ansible", "Prometheus", "Grafana", "Nginx",
    "Linux", "Bash", "Helm",
    # AI / ML / Data
    "Machine Learning", "Deep Learning", "TensorFlow", "PyTorch", "Scikit-learn",
    "NLP", "Computer Vision", "Data Analysis", "Pandas", "NumPy", "Spark",
    "Hadoop", "Tableau", "Power BI", "Data Engineering", "ETL",
    # Soft skills & other
    "Agile", "Scrum", "Project Management", "Team Leadership", "Communication",
    "Problem Solving", "System Design", "Technical Writing", "Mentoring",
    "Cross-functional Collaboration",
]


def _get_embedding_model():
    """Lazy-load the configured SentenceTransformer embedding model once."""
    global _embedding_model, _embedding_model_load_error
    if _embedding_model_load_error is not None:
        return None

    if _embedding_model is None:
        try:
            from sentence_transformers import SentenceTransformer
            logger.info("Loading SentenceTransformer model %s...", SENTENCE_TRANSFORMER_MODEL_NAME)
            _embedding_model = SentenceTransformer(SENTENCE_TRANSFORMER_MODEL_NAME)
            logger.info("SentenceTransformer model %s loaded.", SENTENCE_TRANSFORMER_MODEL_NAME)
        except Exception as exc:
            _embedding_model_load_error = str(exc)
            logger.error("Could not load SentenceTransformer model %s: %s", SENTENCE_TRANSFORMER_MODEL_NAME, exc)
            return None
    return _embedding_model


def _cosine_similarity(a: np.ndarray, b: np.ndarray) -> float:
    """Compute cosine similarity between two vectors."""
    dot = np.dot(a, b)
    norm_a = np.linalg.norm(a)
    norm_b = np.linalg.norm(b)
    if norm_a == 0 or norm_b == 0:
        return 0.0
    return float(dot / (norm_a * norm_b))


def _text_to_embedding(text: str) -> Optional[np.ndarray]:
    """Convert text to BAAI embedding vector."""
    if not text or not text.strip():
        return None
    try:
        model = _get_embedding_model()
        if model is None:
            return None
        embedding = model.encode(text.strip(), normalize_embeddings=True)
        return embedding
    except Exception as exc:
        logger.error("Failed to generate embedding: %s", exc)
        return None


def _chunk_resume_text(text: str, max_chars: int = 4000) -> List[str]:
    """Split long resume text into overlapping chunks for embedding."""
    text = text.strip()
    if len(text) <= max_chars:
        return [text]

    chunks = []
    overlap = 400
    start = 0
    while start < len(text):
        end = min(start + max_chars, len(text))
        chunks.append(text[start:end])
        start = end - overlap
    return chunks


def _semantic_score_dimension(text: str, reference: str) -> float:
    """Score a resume against a single ATS dimension using embedding similarity."""
    # Encode resume (average chunk embeddings if chunked)
    chunks = _chunk_resume_text(text, 4000)
    chunk_embeddings = []
    for chunk in chunks:
        emb = _text_to_embedding(chunk)
        if emb is not None:
            chunk_embeddings.append(emb)

    if not chunk_embeddings:
        return 0.0

    resume_vec = np.mean(chunk_embeddings, axis=0)

    # Encode reference
    ref_vec = _text_to_embedding(reference)
    if ref_vec is None:
        return 0.0

    similarity = _cosine_similarity(resume_vec, ref_vec)

    # Scale: BAAI/bge cos-sim typically ranges 0.3–0.95 for related content
    # Map to 0–100 range
    min_threshold = 0.35
    max_threshold = 0.90
    if similarity < min_threshold:
        return max(0.0, (similarity / min_threshold) * 30.0)
    normalized = (similarity - min_threshold) / (max_threshold - min_threshold)
    normalized = max(0.0, min(1.0, normalized))
    return normalized * 100.0


def compute_ats_score(resume_text: str) -> Dict:
    """
    Compute semantic ATS score using BAAI/bge embeddings.
    Returns {ats_score, dimension_scores, strengths, improvements, extracted_skills}
    """
    if not resume_text or len(resume_text.strip()) < 100:
        return {
            "ats_score": 0,
            "dimension_scores": {},
            "strengths": ["Resume text is too short for meaningful analysis."],
            "improvements": ["Provide a complete resume with at least 100 characters."],
            "extracted_skills": [],
        }

    dimension_scores: Dict[str, float] = {}
    total_score = 0.0

    for dimension, reference in ATS_REFERENCE_PROFILES.items():
        score = _semantic_score_dimension(resume_text, reference)
        dimension_scores[dimension] = round(score, 1)
        weight = DIMENSION_WEIGHTS.get(dimension, 0.125)
        total_score += score * weight

    if not any(dimension_scores.values()):
        return _compute_rule_based_fallback_score(resume_text)

    ats_score = int(round(min(100.0, max(0.0, total_score))))

    # ── Determine strengths & improvements based on dimension scores ──
    strengths = _build_strengths(dimension_scores)
    improvements = _build_improvements(dimension_scores)

    # ── Extract skills via semantic embedding similarity ──
    extracted_skills = _extract_skills_semantic(resume_text)

    return {
        "ats_score": ats_score,
        "dimension_scores": dimension_scores,
        "strengths": strengths,
        "improvements": improvements,
        "extracted_skills": extracted_skills,
        "model_name": SENTENCE_TRANSFORMER_MODEL_NAME,
        "scoring_method": "sentence-transformer-semantic-similarity",
        "model_available": True,
    }


def _compute_rule_based_fallback_score(resume_text: str) -> Dict:
    """
    Return a useful ATS estimate when the SentenceTransformer model is not
    downloaded yet or cannot be loaded in the current environment.
    """
    lower_text = resume_text.lower()
    words = re.findall(r"\b[\w+#.-]+\b", lower_text)
    word_count = len(words)

    section_keywords = {
        "summary": ["summary", "profile", "objective"],
        "technical_skills": ["skills", "technical skills", "technologies"],
        "experience_depth": ["experience", "work experience", "internship", "employment"],
        "education_certs": ["education", "certification", "certifications", "degree"],
        "projects": ["projects", "portfolio"],
    }
    action_verbs = [
        "built", "designed", "developed", "implemented", "optimized", "led",
        "managed", "deployed", "automated", "integrated", "delivered",
        "reduced", "increased", "engineered", "launched", "scaled",
    ]
    metric_matches = re.findall(r"(\d+%|\d+\+? users?|\d+\+? projects?|\d+\+? ms|\d+\+? seconds?|\$\d+|\d+x)", lower_text)
    extracted_skills = _extract_skills_by_keyword(resume_text)

    structure_score = min(100.0, sum(any(keyword in lower_text for keyword in keywords) for keywords in section_keywords.values()) * 20.0)
    action_score = min(100.0, sum(1 for verb in action_verbs if verb in lower_text) * 12.5)
    impact_score = min(100.0, len(metric_matches) * 25.0)
    skill_score = min(100.0, len(extracted_skills) * 8.0)
    brevity_score = 85.0 if 350 <= word_count <= 900 else 60.0 if 180 <= word_count < 1200 else 35.0
    keyword_score = min(100.0, len(set(extracted_skills)) * 7.0 + sum(1 for verb in action_verbs if verb in lower_text) * 3.0)
    experience_score = 75.0 if any(keyword in lower_text for keyword in section_keywords["experience_depth"]) else 35.0
    education_score = 80.0 if any(keyword in lower_text for keyword in section_keywords["education_certs"]) else 30.0

    dimension_scores = {
        "structure": round(structure_score, 1),
        "action_verbs": round(action_score, 1),
        "measurable_impact": round(impact_score, 1),
        "technical_skills": round(skill_score, 1),
        "brevity_clarity": round(brevity_score, 1),
        "keyword_match": round(keyword_score, 1),
        "experience_depth": round(experience_score, 1),
        "education_certs": round(education_score, 1),
    }

    ats_score = int(round(sum(dimension_scores[dim] * DIMENSION_WEIGHTS.get(dim, 0.125) for dim in dimension_scores)))

    return {
        "ats_score": max(0, min(100, ats_score)),
        "dimension_scores": dimension_scores,
        "strengths": _build_strengths(dimension_scores),
        "improvements": _build_improvements(dimension_scores),
        "extracted_skills": extracted_skills,
        "model_name": SENTENCE_TRANSFORMER_MODEL_NAME,
        "scoring_method": "rule-based-fallback",
        "model_available": False,
    }


def _build_strengths(dimension_scores: Dict[str, float]) -> List[str]:
    """Generate strengths from top-performing dimensions."""
    thresholds = {
        "structure": "Resume has clear section structure and professional formatting.",
        "action_verbs": "Good use of strong action verbs throughout experience descriptions.",
        "measurable_impact": "Achievements are quantified with numbers and measurable results.",
        "technical_skills": "Relevant technical skills are well-represented.",
        "brevity_clarity": "Content is concise, clear, and well-written.",
        "keyword_match": "Good keyword density matching industry expectations.",
        "experience_depth": "Work experience shows depth and career progression.",
        "education_certs": "Education and certifications are clearly presented.",
    }

    strengths = []
    for dim, desc in thresholds.items():
        if dimension_scores.get(dim, 0) >= 60:
            strengths.append(desc)
    if not strengths:
        strengths.append("Upload a more detailed resume to get personalized feedback.")
    return strengths[:5]


def _build_improvements(dimension_scores: Dict[str, float]) -> List[str]:
    """Generate improvements from lowest-performing dimensions."""
    suggestions = {
        "structure": "Add clear section headings (Summary, Skills, Experience, Projects, Education). Use consistent formatting with bullet points.",
        "action_verbs": "Replace weak phrases with strong action verbs like 'built', 'designed', 'implemented', 'optimized', 'led'.",
        "measurable_impact": "Quantify achievements with numbers — add percentages, dollar amounts, time saved, or scale metrics.",
        "technical_skills": "Include more relevant technical skills and tools. List them in a dedicated Skills section.",
        "brevity_clarity": "Keep bullet points to 1-2 lines. Remove filler words and personal pronouns. Aim for 1-2 pages.",
        "keyword_match": "Add more industry-relevant keywords matching your target roles. Include both hard and soft skills.",
        "experience_depth": "Describe work experience with context (company, role, dates), responsibilities, and measurable outcomes.",
        "education_certs": "List degrees with institution names and graduation years. Add relevant certifications.",
    }

    # Get bottom 3 dimensions
    sorted_dims = sorted(dimension_scores.items(), key=lambda x: x[1])
    improvements = []
    for dim, score in sorted_dims:
        if score < 60 and dim in suggestions:
            improvements.append(suggestions[dim])
    if not improvements:
        improvements.append("Your resume is well-structured. Fine-tune keyword density for specific job descriptions.")
    return improvements[:6]


def _extract_skills_by_keyword(resume_text: str) -> List[str]:
    """Extract explicitly mentioned skills without requiring embeddings."""
    lower_text = resume_text.lower()
    matched = []
    for skill in SKILL_TAXONOMY:
        pattern = r"(?<![\w+#.-])" + re.escape(skill.lower()) + r"(?![\w+#.-])"
        if re.search(pattern, lower_text):
            matched.append(skill)
    return matched[:15]


def _extract_skills_semantic(resume_text: str) -> List[str]:
    """Extract skills from resume using semantic embedding similarity."""
    resume_vec = _text_to_embedding(_chunk_resume_text(resume_text, 4000)[0])
    if resume_vec is None:
        return _extract_skills_by_keyword(resume_text)

    try:
        model = _get_embedding_model()
        # Batch-encode all skills
        skill_embeddings = model.encode(SKILL_TAXONOMY, normalize_embeddings=True)
        similarities = np.dot(skill_embeddings, resume_vec)

        # Match skills with similarity >= threshold
        threshold = 0.45
        matched = []
        for idx, sim in enumerate(similarities):
            if float(sim) >= threshold:
                # Also check if skill appears as substring in resume (case-insensitive)
                skill_lower = SKILL_TAXONOMY[idx].lower()
                if skill_lower in resume_text.lower():
                    matched.append((SKILL_TAXONOMY[idx], float(sim)))

        # Sort by similarity, return top 15 skill names
        matched.sort(key=lambda x: x[1], reverse=True)
        return [skill for skill, _ in matched[:15]]
    except Exception as exc:
        logger.error("Skill extraction failed: %s", exc)
        return []
