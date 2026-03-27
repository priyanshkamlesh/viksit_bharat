from typing import Dict, List


def normalize_words(items: List[str]) -> set[str]:
    words = set()
    for item in items:
        for word in item.lower().replace(",", " ").replace("?", " ").split():
            cleaned = word.strip(".!:;")
            if cleaned:
                words.add(cleaned)
    return words


def score_questions(questions: List[str]) -> tuple[int, List[str]]:
    if not questions:
        return 20, ["Ask more questions so your partner can evaluate your interview style."]

    total_words = sum(len(question.split()) for question in questions)
    technical_count = sum(
        1
        for question in questions
        if any(keyword in question.lower() for keyword in ["why", "how", "design", "tradeoff", "optimize"])
    )

    score = min(100, 45 + len(questions) * 8 + total_words // 6 + technical_count * 6)
    suggestions = []

    if technical_count < max(1, len(questions) // 2):
        suggestions.append("Add more probing follow-up questions about tradeoffs, scale, or decision making.")
    if total_words / len(questions) < 6:
        suggestions.append("Make your questions more specific so they test depth instead of surface recall.")
    if not suggestions:
        suggestions.append("Your questions are balanced. Keep mixing technical depth with clarifying follow-ups.")

    return score, suggestions


def score_answers(answers: List[str]) -> tuple[int, List[str]]:
    if not answers:
        return 20, ["Provide answer transcripts so the system can evaluate communication and technical depth."]

    total_words = sum(len(answer.split()) for answer in answers)
    structured_count = sum(
        1
        for answer in answers
        if any(keyword in answer.lower() for keyword in ["because", "example", "first", "then", "finally", "tradeoff"])
    )

    score = min(100, 40 + len(answers) * 10 + total_words // 8 + structured_count * 7)
    suggestions = []

    if total_words / len(answers) < 25:
        suggestions.append("Expand your answers with more reasoning, examples, and clearer structure.")
    if structured_count < max(1, len(answers) // 2):
        suggestions.append("Use a clearer framework such as problem, approach, tradeoff, and conclusion.")
    if not suggestions:
        suggestions.append("Your answers show solid structure. Keep supporting claims with examples and tradeoffs.")

    return score, suggestions


def focus_alignment(focus_areas: List[str], interview_text: List[str]) -> tuple[int, List[str]]:
    focus_words = normalize_words(focus_areas)
    interview_words = normalize_words(interview_text)

    if not focus_words:
        return 0, []

    matched_words = sorted(focus_words.intersection(interview_words))
    return len(matched_words), matched_words


def build_feedback(user: Dict, asked_questions: List[str], answers: List[str]) -> Dict:
    question_score, interviewer_suggestions = score_questions(asked_questions)
    answer_score, answer_suggestions = score_answers(answers)
    alignment_count, matched_topics = focus_alignment(
        user.get("mock_interview", {}).get("focus_areas", []),
        asked_questions + answers,
    )

    alignment_score = min(alignment_count * 8, 24)
    overall_score = round(
        min(100, question_score * 0.45 + answer_score * 0.45 + alignment_score),
        1,
    )

    strengths = []
    if question_score >= 70:
        strengths.append("Asked purposeful interview questions")
    if answer_score >= 70:
        strengths.append("Answered with useful detail and structure")
    if matched_topics:
        strengths.append("Stayed aligned with focus areas: " + ", ".join(matched_topics))
    if not strengths:
        strengths.append("Completed the mock interview and generated analyzable interview data")

    return {
        "user_id": user["id"],
        "user_name": user["name"],
        "target_role": user.get("mock_interview", {}).get("target_role"),
        "overall_score": overall_score,
        "interviewer_feedback": {
            "score": question_score,
            "strengths": strengths[:2],
            "improvements": interviewer_suggestions,
        },
        "candidate_feedback": {
            "score": answer_score,
            "strengths": strengths[-2:],
            "improvements": answer_suggestions,
        },
    }


def generate_ai_question(user: Dict, previous_turns: List[Dict]) -> str:
    focus_areas = user.get("mock_interview", {}).get("focus_areas", [])
    target_role = user.get("mock_interview", {}).get("target_role", "candidate")
    asked_count = len(previous_turns)

    starters = [
        f"Tell me about yourself and why you are targeting the {target_role} role.",
        f"How would you solve a practical problem related to {focus_areas[0] if focus_areas else 'your target role'}?",
        f"Describe a challenging project and the tradeoffs you handled in {focus_areas[1] if len(focus_areas) > 1 else 'your work'}.",
        f"If this system had to scale, how would you improve reliability and performance for {focus_areas[0] if focus_areas else 'the product'}?",
    ]

    if asked_count < len(starters):
        return starters[asked_count]

    return (
        f"Let's go one level deeper. Give a structured answer about a real example "
        f"where you used {focus_areas[asked_count % len(focus_areas)] if focus_areas else 'your core skills'}."
    )


def build_ai_practice_feedback(user: Dict, turns: List[Dict]) -> Dict:
    bot_questions = [turn["bot_question"] for turn in turns]
    user_answers = [turn["user_answer"] for turn in turns]
    feedback = build_feedback(user, bot_questions, user_answers)

    feedback["practice_summary"] = {
        "rounds_completed": len(turns),
        "focus_areas": user.get("mock_interview", {}).get("focus_areas", []),
        "next_step": "Practice one more round with clearer examples and stronger tradeoff discussion."
    }
    return feedback
