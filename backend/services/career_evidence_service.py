from typing import List


# =========================================================
# NORMALIZE SKILL
# =========================================================

def normalize_skill(skill: str) -> str:

    if not skill:
        return ""

    skill = (
        str(skill)
        .strip()
        .lower()
    )

    aliases = {

        # JavaScript
        "js": "javascript",
        "javascript": "javascript",

        # React
        "react": "react",
        "react.js": "react",
        "reactjs": "react",
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

        # REST
        "rest": "rest apis",
        "rest api": "rest apis",
        "rest apis": "rest apis",
        "restful": "rest apis",
        "restful api": "rest apis",
        "restful apis": "rest apis",

        # MongoDB
        "mongo": "mongodb",
        "mongodb": "mongodb",

        # SQL
        "sql": "sql",

        # HTML / CSS
        "html": "html",
        "css": "css",

        # DSA
        "dsa": "data structures",
        "data structure": "data structures",
        "data structures": "data structures",

        # Algorithms
        "algo": "algorithms",
        "algorithm": "algorithms",
        "algorithms": "algorithms",

        # ML
        "ml": "machine learning",
        "machine learning": "machine learning",

        # DL
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
        "object oriented programming":
            "object oriented programming",
    }

    return aliases.get(
        skill,
        skill
    )


# =========================================================
# PROFICIENCY SCORE
# =========================================================

def get_proficiency_score(level):

    if not level:
        return 50

    level = (
        str(level)
        .strip()
        .lower()
    )

    proficiency_scores = {

        "beginner": 35,

        "basic": 35,

        "intermediate": 60,

        "pro": 85,

        "advanced": 95,

        "expert": 100,
    }

    return proficiency_scores.get(
        level,
        50
    )


# =========================================================
# GET FIELD FROM SKILL
# =========================================================

def get_skill_value(
    skill,
    key,
    default=None
):

    if isinstance(skill, dict):

        return skill.get(
            key,
            default
        )

    return getattr(
        skill,
        key,
        default
    )


# =========================================================
# EXTRACT SKILL INFORMATION
# =========================================================

def extract_skill(skill):

    # String skill
    if isinstance(skill, str):

        return (
            skill,
            ""
        )

    # Object skill
    skill_name = (

        get_skill_value(
            skill,
            "name",
            ""
        )

        or

        get_skill_value(
            skill,
            "skill",
            ""
        )

        or

        get_skill_value(
            skill,
            "title",
            ""
        )
    )

    level = (

        get_skill_value(
            skill,
            "level",
            ""
        )

        or

        get_skill_value(
            skill,
            "proficiency",
            ""
        )

        or

        get_skill_value(
            skill,
            "skill_level",
            ""
        )
    )

    return (
        skill_name,
        level
    )


# =========================================================
# CALCULATE SKILL EVIDENCE
# =========================================================

def calculate_skill_evidence(
    resume_skills,
    project_skills,
    github_skills=None
):

    resume_skills = resume_skills or []

    project_skills = project_skills or []

    github_skills = github_skills or []

    evidence = {}

    # =====================================================
    # PROFILE / RESUME SKILLS
    # =====================================================

    for skill in resume_skills:

        skill_name, level = extract_skill(
            skill
        )

        skill_name = normalize_skill(
            skill_name
        )

        if not skill_name:
            continue

        proficiency_score = (
            get_proficiency_score(
                level
            )
        )

        evidence[skill_name] = max(
            evidence.get(
                skill_name,
                0
            ),
            proficiency_score
        )

    # =====================================================
    # PROJECT SKILLS
    # =====================================================

    for skill in project_skills:

        skill_name, _ = extract_skill(
            skill
        )

        skill_name = normalize_skill(
            skill_name
        )

        if not skill_name:
            continue

        evidence[skill_name] = min(
            evidence.get(
                skill_name,
                0
            ) + 15,
            100
        )

    # =====================================================
    # GITHUB SKILLS
    # =====================================================

    for skill in github_skills:

        skill_name, _ = extract_skill(
            skill
        )

        skill_name = normalize_skill(
            skill_name
        )

        if not skill_name:
            continue

        evidence[skill_name] = min(
            evidence.get(
                skill_name,
                0
            ) + 10,
            100
        )

    return evidence


# =========================================================
# PROJECT SCORE
# =========================================================

def calculate_project_score(
    projects: List[dict]
) -> float:

    if not projects:
        return 0.0

    total_score = 0.0

    for project in projects:

        score = 0.0

        if project.get("title"):
            score += 10

        if project.get("description"):
            score += 10

        if project.get("technologies"):
            score += 20

        if project.get("github_url"):
            score += 20

        if project.get("live_url"):
            score += 15

        if project.get("problem_statement"):
            score += 15

        if project.get("deployment"):
            score += 10

        total_score += min(
            score,
            100
        )

    return round(
        min(
            total_score / len(projects),
            100
        ),
        2
    )


# =========================================================
# ASSESSMENT SCORE
# =========================================================

def calculate_assessment_score(
    mock_tests: List[dict]
) -> float:

    if not mock_tests:
        return 0.0

    scores = []

    for test in mock_tests:

        score = (
            test.get("percentage")
            or test.get("score")
            or test.get("marks")
            or 0
        )

        try:
            score = float(score)
        except (
            TypeError,
            ValueError
        ):
            score = 0.0

        scores.append(
            max(
                0,
                min(
                    score,
                    100
                )
            )
        )

    if not scores:
        return 0.0

    return round(
        sum(scores) / len(scores),
        2
    )


# =========================================================
# BUILD CAREER EVIDENCE
# =========================================================

def build_career_evidence(
    resume_skills=None,
    project_skills=None,
    github_skills=None,
    projects=None,
    mock_tests=None,
    ats_score=0,
    interview_score=0
):

    resume_skills = resume_skills or []

    project_skills = project_skills or []

    github_skills = github_skills or []

    projects = projects or []

    mock_tests = mock_tests or []

    # -----------------------------------------------------
    # SKILL EVIDENCE
    # -----------------------------------------------------

    skill_evidence = calculate_skill_evidence(

        resume_skills=resume_skills,

        project_skills=project_skills,

        github_skills=github_skills
    )

    # -----------------------------------------------------
    # PROJECT SCORE
    # -----------------------------------------------------

    project_score = calculate_project_score(
        projects
    )

    # -----------------------------------------------------
    # ASSESSMENT SCORE
    # -----------------------------------------------------

    assessment_score = calculate_assessment_score(
        mock_tests
    )

    # -----------------------------------------------------
    # ATS
    # -----------------------------------------------------

    try:
        ats = float(
            ats_score or 0
        )
    except (
        TypeError,
        ValueError
    ):
        ats = 0.0

    # -----------------------------------------------------
    # INTERVIEW
    # -----------------------------------------------------

    try:
        interview = float(
            interview_score or 0
        )
    except (
        TypeError,
        ValueError
    ):
        interview = 0.0

    return {

        "skills": skill_evidence,

        "ats_score": max(
            0,
            min(
                ats,
                100
            )
        ),

        "project_score": project_score,

        "interview_score": max(
            0,
            min(
                interview,
                100
            )
        ),

        "assessment_score": assessment_score
    }