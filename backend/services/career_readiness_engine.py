import json
from pathlib import Path
from typing import Dict

DATA_PATH = Path(__file__).resolve().parent.parent / "data" / "career_roles.json"


# ==========================================================
# SKILL ALIASES
# ==========================================================

ALIASES = {
    # JavaScript
    "js": "javascript",
    "javascript": "javascript",
    # React
    "react": "react",
    "reactjs": "react",
    "react.js": "react",
    "react js": "react",
    # Node
    "node": "node.js",
    "nodejs": "node.js",
    "node.js": "node.js",
    "node js": "node.js",
    # Express
    "express": "express.js",
    "expressjs": "express.js",
    "express.js": "express.js",
    "express js": "express.js",
    # REST APIs
    "rest": "rest apis",
    "rest api": "rest apis",
    "rest apis": "rest apis",
    "restful": "rest apis",
    "restful api": "rest apis",
    "restful apis": "rest apis",
    # HTML
    "html": "html",
    # CSS
    "css": "css",
    # SQL
    "sql": "sql",
    # MongoDB
    "mongodb": "mongodb",
    "mongo": "mongodb",
    # Git
    "git": "git",
    "github": "github",
    # Data Structures
    "dsa": "data structures",
    "data structure": "data structures",
    "data structures": "data structures",
    # Algorithms
    "algo": "algorithms",
    "algorithm": "algorithms",
    "algorithms": "algorithms",
    # Machine Learning
    "ml": "machine learning",
    "machine learning": "machine learning",
    # Deep Learning
    "dl": "deep learning",
    "deep learning": "deep learning",
    # Scikit-learn
    "sklearn": "scikit-learn",
    "scikit learn": "scikit-learn",
    "scikit-learn": "scikit-learn",
    # Power BI
    "powerbi": "power bi",
    "power bi": "power bi",
    # OOP
    "oop": "object oriented programming",
    "object oriented programming": "object oriented programming",
}


# ==========================================================
# NORMALIZE SKILL
# ==========================================================


def normalize_skill(skill: str) -> str:
    """
    Convert different spellings of a skill into one
    canonical skill name.
    """

    if not skill:
        return ""

    skill = str(skill).strip().lower()

    # Normalize spaces
    skill = " ".join(skill.split())

    return ALIASES.get(skill, skill)


# ==========================================================
# LOAD ROLE REQUIREMENTS
# ==========================================================


def load_role_requirements() -> Dict:
    """
    Load career role requirements from JSON.
    """

    with DATA_PATH.open("r", encoding="utf-8") as handle:

        return json.load(handle)


# ==========================================================
# NORMALIZE SKILL DICTIONARY
# ==========================================================


def normalize_skills(skills: Dict) -> Dict[str, float]:
    """
    Normalize user skill names and keep their
    proficiency/evidence score.
    """

    normalized = {}

    for name, value in (skills or {}).items():

        normalized_name = normalize_skill(name)

        if not normalized_name:
            continue
        # Ignore accidental profile keys such as "skills"
        if normalized_name == "skills":
            continue
        try:
            score = float(value)

        except (TypeError, ValueError):
            score = 0.0

        score = max(0.0, min(100.0, score))

        # Keep strongest evidence if duplicate skills exist
        normalized[normalized_name] = max(normalized.get(normalized_name, 0.0), score)

    return normalized


# ==========================================================
# NORMALIZE ROLE REQUIREMENTS
# ==========================================================


def normalize_requirements(requirements: Dict) -> Dict[str, float]:

    normalized = {}

    for name, value in (requirements or {}).items():

        normalized_name = normalize_skill(name)

        if not normalized_name:
            continue

        try:
            required = float(value)

        except (TypeError, ValueError):
            required = 0.0

        required = max(0.0, min(100.0, required))

        normalized[normalized_name] = required

    return normalized


# ==========================================================
# PRIORITY CALCULATION
# ==========================================================


def calculate_priority(gap: float, required: float) -> str:

    if required <= 0:
        return "none"

    ratio = gap / required

    if gap >= 35 or ratio >= 0.45:
        return "high"

    if gap >= 18 or ratio >= 0.22:
        return "medium"

    return "low"


# ==========================================================
# CAREER ANALYSIS
# ==========================================================


def analyze_career(
    target_role,
    skills,
    ats_score=None,
    project_score=None,
    interview_score=None,
    assessment_score=None,
):
    # --------------------------------------------------
    # LOAD ROLE REQUIREMENTS
    # --------------------------------------------------

    role_requirements = load_role_requirements()

    if target_role not in role_requirements:
        raise ValueError(f"Unknown career role: {target_role}")

    requirements = role_requirements[target_role].get("skills", {})

    # --------------------------------------------------
    # NORMALIZE USER SKILLS
    # --------------------------------------------------

    normalized_skills = normalize_skills(skills)

    # --------------------------------------------------
    # NORMALIZE ROLE REQUIREMENTS
    # --------------------------------------------------

    normalized_requirements = {}

    for skill, required in requirements.items():

        normalized_name = normalize_skill(skill)

        if not normalized_name:
            continue

        try:
            required = float(required)
        except (TypeError, ValueError):
            required = 0

        normalized_requirements[normalized_name] = max(0, min(required, 100))

    # --------------------------------------------------
    # COMBINE ROLE SKILLS + USER SKILLS
    #
    # This is important because:
    #
    # Role may require:
    # SQL
    # Git
    # MongoDB
    #
    # User may have:
    # React
    # Node.js
    # HTML
    #
    # We want BOTH groups displayed.
    # --------------------------------------------------

    all_skill_names = sorted(
        set(normalized_requirements.keys()).union(normalized_skills.keys())
    )

    all_skills = []

    skill_gaps = []

    matched_skills = []

    # --------------------------------------------------
    # COMPARE SKILLS
    # --------------------------------------------------

    for skill in all_skill_names:

        required = normalized_requirements.get(skill, 0)

        current = normalized_skills.get(skill, 0)

        # Calculate gap
        gap = max(required - current, 0)

        # --------------------------------------------------
        # DETERMINE STATUS
        # --------------------------------------------------

        if required > 0:

            if current >= required:
                status = "matched"
            else:
                status = "gap"

        else:

            if current > 0:
                status = "additional"
            else:
                status = "missing"

        # --------------------------------------------------
        # DETERMINE PRIORITY
        # --------------------------------------------------

        if required <= 0:

            priority = "none"

        else:

            ratio = gap / max(required, 1)

            if gap >= 35 or ratio >= 0.45:
                priority = "high"

            elif gap >= 18 or ratio >= 0.22:
                priority = "medium"

            else:
                priority = "low"

        # --------------------------------------------------
        # COMPLETE SKILL OBJECT
        # --------------------------------------------------

        skill_data = {
            "skill": skill,
            "required": round(required, 2),
            "current": round(current, 2),
            "gap": round(gap, 2),
            "priority": priority,
            "status": status,
        }

        all_skills.append(skill_data)

        # --------------------------------------------------
        # MATCHED SKILLS
        # --------------------------------------------------

        if status == "matched":

            matched_skills.append(
                {
                    "skill": skill,
                    "required": round(required, 2),
                    "current": round(current, 2),
                    "gap": 0,
                    "status": "matched",
                }
            )

        # --------------------------------------------------
        # ADDITIONAL USER SKILLS
        # --------------------------------------------------

        elif status == "additional":

            matched_skills.append(
                {
                    "skill": skill,
                    "required": 0,
                    "current": round(current, 2),
                    "gap": 0,
                    "status": "additional",
                }
            )

        # --------------------------------------------------
        # REQUIRED SKILL WITH GAP
        # --------------------------------------------------

        elif status == "gap":

            skill_gaps.append(
                {
                    "skill": skill,
                    "required": round(required, 2),
                    "current": round(current, 2),
                    "gap": round(gap, 2),
                    "priority": priority,
                }
            )

    # --------------------------------------------------
    # SORT SKILL GAPS
    # --------------------------------------------------

    priority_order = {"high": 0, "medium": 1, "low": 2}

    skill_gaps.sort(
        key=lambda item: (priority_order.get(item["priority"], 3), -item["gap"])
    )

    # --------------------------------------------------
    # SKILL ALIGNMENT
    #
    # Example:
    #
    # React required = 80
    # User current = 85
    #
    # Alignment = 100%
    #
    # REST APIs required = 75
    # User current = 60
    #
    # Alignment = 80%
    # --------------------------------------------------

    required_skill_scores = []

    for skill, required in normalized_requirements.items():

        if required <= 0:
            continue

        current = normalized_skills.get(skill, 0)

        alignment = min(current / required, 1) * 100

        required_skill_scores.append(alignment)

    if required_skill_scores:

        skill_alignment = sum(required_skill_scores) / len(required_skill_scores)

    else:

        skill_alignment = 0

    # --------------------------------------------------
    # COMPONENT SCORES
    # --------------------------------------------------

    ats = float(ats_score or 0)

    projects = float(project_score or 0)

    interview = float(interview_score or 0)

    assessment = float(assessment_score or 0)

    # --------------------------------------------------
    # OVERALL READINESS
    # --------------------------------------------------

    readiness_score = (
        skill_alignment * 0.50
        + ats * 0.15
        + projects * 0.10
        + interview * 0.15
        + assessment * 0.10
    )

    readiness_score = round(max(0, min(readiness_score, 100)), 2)

    # --------------------------------------------------
    # PRIORITY GAPS
    # --------------------------------------------------

    priority_gaps = [gap for gap in skill_gaps if gap["priority"] == "high"]

    # --------------------------------------------------
    # RECOMMENDATIONS
    # --------------------------------------------------

    recommendations = []

    for gap in skill_gaps[:5]:

        recommendations.append(
            f"Improve {gap['skill']} "
            f"from {gap['current']}% "
            f"towards the required "
            f"{gap['required']}%."
        )

    if not recommendations:

        recommendations.append(
            "Continue strengthening your "
            "existing skills through projects, "
            "assessments, and interview practice."
        )

# --------------------------------------------------
# REQUIRED SKILLS
# --------------------------------------------------

    required_skills = []

    for skill, required in normalized_requirements.items():

        if required <= 0:
            continue

            required_skills.append({
                "skill": skill,
                "required": round(required, 2)
            })


# --------------------------------------------------
# RETURN
# --------------------------------------------------

    return {

    "target_role": target_role,

    "readiness_score": readiness_score,

    # Skills required by the selected role
    "required_skills": required_skills,

    # Skills currently matching the role
    "matched_skills": matched_skills,

    # Complete comparison - kept for compatibility
    "all_skills": all_skills,

    # Skills that need to be learned/improved
    "skill_gaps": skill_gaps,

    # High-priority gaps
    "priority_gaps": priority_gaps,

    "component_scores": {

        "skill_alignment": round(
            skill_alignment,
            2
        ),

        "resume_ats": round(
            ats,
            2
        ),

        "projects": round(
            projects,
            2
        ),

        "interview": round(
            interview,
            2
        ),

        "assessment": round(
            assessment,
            2
        )
    },

    "recommendations": recommendations
}