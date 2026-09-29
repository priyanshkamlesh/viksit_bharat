from backend.models.ai_roadmap_model import generate_mock_test


ALLOWED_DIFFICULTIES = {
    "easy",
    "medium",
    "hard",
    "mixed",
}


def generate_career_assessment(
    target_role: str,
    skill: str,
    question_count: int = 10,
    difficulty: str = "mixed",
):
    target_role = str(
        target_role or ""
    ).strip()

    skill = str(
        skill or ""
    ).strip()

    difficulty = str(
        difficulty or "mixed"
    ).strip().lower()

    if not target_role:
        return {
            "error": "Career role is required.",
            "questions": [],
        }

    if not skill:
        return {
            "error": "Assessment skill is required.",
            "questions": [],
        }

    if difficulty not in ALLOWED_DIFFICULTIES:
        difficulty = "mixed"

    question_count = max(
        10,
        min(
            20,
            int(question_count or 10)
        )
    )

    # /*
    #  * Reuse the existing AI MCQ engine used by
    #  * Mock Test.
    #  *
    #  * This keeps MCQ generation consistent while
    #  * keeping Career Assessment as a separate
    #  * feature and data flow.
    #  */

    result = generate_mock_test(
        category="technical",
        skill=skill,
        question_count=question_count,
    )

    if not result.get("questions"):
        return {
            "error": result.get(
                "error",
                "Could not generate career assessment."
            ),
            "questions": [],
        }

    return {
        "target_role": target_role,
        "skill": skill,
        "difficulty": difficulty,
        "questions": result["questions"],
        "source": result.get(
            "source",
            "AI generated"
        ),
    }