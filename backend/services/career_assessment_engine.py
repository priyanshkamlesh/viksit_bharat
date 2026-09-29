import json
import os

from openai import OpenAI


def get_ai_client():
    api_key = os.getenv("OPENAI_API_KEY")

    if not api_key:
        raise RuntimeError("OPENAI_API_KEY is not configured")

    return OpenAI(api_key=api_key)


def generate_career_assessment(
    target_role: str,
    skill: str,
    question_count: int = 10,
    difficulty: str = "mixed"
):
    client = get_ai_client()

    prompt = f"""
You are an expert technical assessment generator.

Create a multiple-choice career assessment for:

Target Career Role:
{target_role}

Skill:
{skill}

Number of Questions:
{question_count}

Difficulty:
{difficulty}

Requirements:

1. Generate exactly {question_count} MCQs.
2. Questions must be relevant to the selected skill.
3. Questions should evaluate practical career readiness.
4. Avoid duplicate questions.
5. Include a mixture of conceptual and practical questions.
6. Each question must have exactly four options.
7. Only one option must be correct.
8. Include the correct option index.
9. Include a short explanation for the correct answer.
10. Return ONLY valid JSON.

JSON format:

{{
  "questions": [
    {{
      "id": 1,
      "question": "Question text",
      "options": [
        "Option A",
        "Option B",
        "Option C",
        "Option D"
      ],
      "correct_index": 0,
      "explanation": "Explanation"
    }}
  ]
}}
"""

    response = client.chat.completions.create(
        model="gpt-4o-mini",
        temperature=0.7,
        messages=[
            {
                "role": "system",
                "content": "You generate high-quality career assessment MCQs."
            },
            {
                "role": "user",
                "content": prompt
            }
        ]
    )

    content = response.choices[0].message.content

    if not content:
        raise RuntimeError("AI returned an empty response")

    try:
        data = json.loads(content)
    except json.JSONDecodeError as error:
        raise RuntimeError(
            "AI returned invalid JSON"
        ) from error

    questions = data.get("questions", [])

    if len(questions) != question_count:
        raise RuntimeError(
            f"Expected {question_count} questions, received {len(questions)}"
        )

    return {
        "target_role": target_role,
        "skill": skill,
        "difficulty": difficulty,
        "questions": questions
    }