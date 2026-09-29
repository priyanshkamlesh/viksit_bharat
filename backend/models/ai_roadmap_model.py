import json
import os
import re
from pathlib import Path

from dotenv import load_dotenv

try:
    from openai import OpenAI
except ImportError:
    OpenAI = None


env_path = Path(__file__).resolve().parent.parent / ".env"
load_dotenv(dotenv_path=env_path)


def _humanize_role(value: str) -> str:
    text = re.sub(r"[-_]+", " ", str(value or "")).strip()
    return re.sub(r"\s+", " ", text).title()


def _extract_json_object(text: str) -> dict:
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

    raise ValueError("Could not parse JSON object from AI response")


def _client():
    api_key = os.getenv("CHATGPT_API_KEY") or os.getenv("OPENAI_API_KEY") or os.getenv("OPENAI_API")
    if not OpenAI or not api_key:
        return None
    base_url = os.getenv("CHATGPT_BASE_URL") or os.getenv("OPENAI_BASE_URL")
    kwargs = {"api_key": api_key}
    if base_url:
        kwargs["base_url"] = base_url
    return OpenAI(**kwargs)


def _fallback_role_specializations(role_title: str) -> dict:
    base = role_title or "Software Engineer"
    templates = [
        ("Core Practitioner", f"Focus on day-to-day execution and delivery as a {base}."),
        ("Systems Specialist", f"Own architecture, integration points, and reliability for {base} work."),
        ("Product-Focused Specialist", f"Connect user needs, feature decisions, and practical delivery for {base} roles."),
        ("Quality Specialist", f"Improve testing, review habits, maintainability, and release confidence."),
        ("Operations Specialist", f"Work on deployment, monitoring, support, and process improvement."),
        ("Research & Innovation Specialist", f"Explore new methods, tooling, and advanced practices in the {base} space."),
    ]
    return {
        "role": base,
        "summary": f"Choose a focused path within {base}.",
        "items": [{"title": title, "description": description} for title, description in templates],
    }


def _generate_role_specializations_with_ai(role_title: str) -> dict:
    client = _client()
    if client is None:
        return _fallback_role_specializations(role_title)

    prompt = f"""
You are generating job specializations for a career selection page.

Role: {role_title}

Return ONLY valid JSON matching this schema:
{{
  "title": "Role title",
  "summary": "Short summary",
  "items": [
    {{
      "title": "Specialization name",
      "description": "Short description"
    }}
  ]
}}

Rules:
- Produce 6 to 10 specializations.
- Keep items concise and practical.
- Specializations should be realistic subdivisions of the selected role.
"""

    response = client.chat.completions.create(
        model=os.getenv("CHATGPT_MODEL", os.getenv("OPENAI_ROADMAP_MODEL", "gpt-4o-mini")),
        messages=[{"role": "user", "content": prompt}],
        response_format={"type": "json_object"},
    )
    content = response.choices[0].message.content or "{}"
    return _extract_json_object(content)


def generate_role_specializations(role: str):
    if not isinstance(role, str) or not role.strip():
        return {
            "error": "Role is required",
            "role": "",
            "summary": "",
            "items": [],
        }

    role_title = _humanize_role(role)
    try:
        payload = _generate_role_specializations_with_ai(role_title)
    except Exception as error:
        error_message = str(error)
        if "insufficient_quota" in error_message or "Error code: 429" in error_message:
            return {
                "error": "AI quota exceeded. Please update billing/quota and try again.",
                "error_code": "insufficient_quota",
                "role": role_title,
                "summary": "",
                "items": [],
            }
        return _fallback_role_specializations(role_title)

    raw_items = payload.get("items", []) if isinstance(payload, dict) else []
    cleaned_items = []
    seen = set()

    for entry in raw_items:
        if not isinstance(entry, dict):
            continue
        title = str(entry.get("title") or "").strip()
        description = str(entry.get("description") or "").strip()
        if not title:
            continue
        dedupe_key = title.lower()
        if dedupe_key in seen:
            continue
        seen.add(dedupe_key)
        cleaned_items.append({"title": title, "description": description})

    if not cleaned_items:
        return _fallback_role_specializations(role_title)

    return {
        "role": role_title,
        "summary": payload.get("summary", "") if isinstance(payload, dict) else "",
        "items": cleaned_items,
    }


def generate_tnp_topic_material(track: str, topic: str):
    track_title = str(track or "").strip().title()
    topic_title = str(topic or "").strip()
    groq_key = os.getenv("GROQ_API_KEY")

    if not track_title or not topic_title:
        return {"error": "Track and topic are required", "formulas": [], "cheat_sheet": []}

    if not OpenAI or not groq_key:
        return {"error": "Groq API is not configured", "formulas": [], "cheat_sheet": []}

    client = OpenAI(api_key=groq_key, base_url="https://api.groq.com/openai/v1")
    prompt = f"""
You are an expert training and placement instructor.
Create a study sheet for the {track_title} topic: {topic_title}.

Return ONLY valid JSON matching this schema:
{{
  "title": "topic title",
  "overview": "one short practical overview",
  "formulas": [
    {{"name": "formula name", "formula": "LaTeX formula", "when_to_use": "short use case"}}
  ],
  "cheat_sheet": [
    {{"title": "shortcut or rule", "detail": "clear explanation with inline math wrapped in $...$ when needed"}}
    ],
    "diagrams": [
        {{"title": "diagram title", "steps": ["Step 1", "Step 2"], "explanation": "simple explanation"}}
  ]
}}

Rules:
- Include every important formula or rule commonly needed for this topic.
- For reasoning topics, use rules, patterns, methods, and shortcuts instead of inventing mathematical formulas.
- Keep formulas and explanations accurate, exam-focused, and easy to scan.
- Use simple English and short sentences that a beginner can understand.
- Write mathematical formulas in LaTeX. For example, write `{{}}^nP_r = \\frac{{n!}}{{(n-r)!}}`, not `nPr = n! / (n-r)!`.
- Use subscripts and superscripts in LaTeX, such as `a_i`, `x^2`, and `{{}}^nC_r`.
- Add one or two diagrams only when they make the topic easier to understand, such as a process flow, arrangement, comparison, or decision path.
- For diagrams, return short ordered steps. Do not use Mermaid, SVG, or complex markup.
- Every item in `formulas` must contain exactly: `name`, `formula`, `when_to_use`.
- Every item in `cheat_sheet` must contain exactly: `title`, `detail`. Keep `detail` inside the same object.
- Every item in `diagrams` must contain exactly: `title`, `steps`, `explanation`.
- Do not place any field outside an array item object. Check commas and closing braces before responding.
- Do not include practice questions, quizzes, answers, or motivational content.
- Include 5 to 12 formulas/rules and 5 to 12 cheat-sheet items.
"""

    try:
        model = os.getenv("GROQ_TNP_MODEL", os.getenv("GROQ_CHATBOT_MODEL", "openai/gpt-oss-120b"))
        response = None
        last_error = None
        for attempt in range(2):
            try:
                response = client.chat.completions.create(
                    model=model,
                    messages=[{"role": "user", "content": prompt}],
                    response_format={"type": "json_object"},
                    temperature=0.1,
                )
                break
            except Exception as error:
                last_error = error
                if "json_validate_failed" not in str(error) or attempt == 1:
                    raise
                prompt += "\nIMPORTANT RETRY: Return compact valid JSON. Check that every cheat_sheet entry is a complete {\"title\": \"...\", \"detail\": \"...\"} object before ending the response."

        if response is None:
            raise last_error or RuntimeError("Groq did not return a response")
        payload = _extract_json_object(response.choices[0].message.content or "{}")
        return {
            "title": payload.get("title") or topic_title,
            "overview": payload.get("overview") or f"Key {track_title.lower()} formulas and shortcuts for {topic_title}.",
            "formulas": payload.get("formulas") if isinstance(payload.get("formulas"), list) else [],
            "cheat_sheet": payload.get("cheat_sheet") if isinstance(payload.get("cheat_sheet"), list) else [],
            "diagrams": payload.get("diagrams") if isinstance(payload.get("diagrams"), list) else [],
        }
    except Exception as error:
        return {
            "error": f"Could not generate study material from Groq: {error}",
            "title": topic_title,
            "overview": "",
            "formulas": [],
            "cheat_sheet": [],
            "diagrams": [],
        }


MOCK_TEST_FALLBACKS = {
    "aptitude": [
        ("A price is increased by 20% and then reduced by 20%. What is the net change?", ["No change", "4% increase", "4% decrease", "8% decrease"], 2, "Use 1.20 x 0.80 = 0.96, so the final price is 4% lower."),
        ("What is 25% of 480?", ["100", "110", "120", "140"], 2, "25% is one quarter, and 480 divided by 4 is 120."),
        ("The ratio of two numbers is 3:5 and their sum is 64. What is the larger number?", ["24", "32", "40", "48"], 2, "There are 8 parts, so each part is 8; the larger number is 5 x 8."),
        ("A train travels 150 km in 3 hours. What is its speed?", ["40 km/h", "45 km/h", "50 km/h", "55 km/h"], 2, "Speed equals distance divided by time: 150 / 3."),
        ("What is the average of 12, 18, 20, and 30?", ["18", "20", "22", "24"], 1, "The sum is 80, and 80 divided by 4 is 20."),
        ("If simple interest on Rs. 2,000 for 2 years is Rs. 400, what is the annual rate?", ["5%", "8%", "10%", "12%"], 2, "Rate = (400 x 100) / (2000 x 2) = 10%."),
        ("A worker completes a task in 10 days. What fraction of the task is completed in one day?", ["1/5", "1/10", "1/12", "1/20"], 1, "One full task divided across 10 days is 1/10 per day."),
        ("What is the next number: 2, 6, 12, 20, 30, ?", ["36", "40", "42", "44"], 2, "The differences are +4, +6, +8, +10, then +12."),
        ("A shop gives a 10% discount on Rs. 800. What is the sale price?", ["Rs. 700", "Rs. 720", "Rs. 740", "Rs. 760"], 1, "10% of 800 is 80, so the sale price is 720."),
        ("What is the probability of rolling an even number on a fair six-sided die?", ["1/6", "1/3", "1/2", "2/3"], 2, "The even outcomes are 2, 4, and 6: 3 out of 6 outcomes."),
    ],
    "reasoning": [
        ("Choose the odd one out: Square, Triangle, Circle, Rectangle.", ["Square", "Triangle", "Circle", "Rectangle"], 2, "A circle has no sides; the other shapes are polygons."),
        ("If all developers are problem solvers and Maya is a developer, what follows?", ["Maya is not a problem solver", "Maya is a problem solver", "All problem solvers are developers", "Nothing follows"], 1, "Maya belongs to the set of developers, who are all problem solvers."),
        ("Find the next letter: A, C, F, J, ?", ["M", "N", "O", "P"], 2, "The jumps are +2, +3, +4, then +5: J to O."),
        ("Ravi walks north, turns right, then turns right again. Which direction is he facing?", ["North", "South", "East", "West"], 1, "North, then East, then South."),
        ("Book is to Reading as Fork is to ____.", ["Writing", "Eating", "Cooking", "Cutting"], 1, "A fork is primarily used for eating."),
        ("If CAT is coded as DBU, how is DOG coded?", ["EPH", "EOG", "DPH", "FPH"], 0, "Each letter is shifted one position forward: D-E, O-P, G-H."),
        ("Five people stand in a line. Who is in the middle position?", ["First", "Second", "Third", "Fourth"], 2, "The middle of five ordered positions is the third."),
        ("Which statement is logically valid?", ["Some birds are animals", "All animals are birds", "No birds are animals", "All birds are mammals"], 0, "Birds are a subset of animals, so some birds are animals."),
        ("If today is Monday, what day will it be after 10 days?", ["Tuesday", "Wednesday", "Thursday", "Friday"], 2, "10 modulo 7 is 3; Monday plus 3 days is Thursday."),
        ("Complete the analogy: Seed : Plant :: Egg : ____.", ["Nest", "Bird", "Shell", "Wing"], 1, "An egg develops into a bird, just as a seed develops into a plant."),
    ],
}


def _fallback_mock_test(category: str, skill: str, question_count: int) -> dict:
    normalized_category = category.lower().strip()
    questions = MOCK_TEST_FALLBACKS.get(normalized_category)
    if normalized_category == "technical":
        topic = skill.strip() or "programming fundamentals"
        questions = [
            (f"Which practice best improves code quality when working with {topic}?", ["Skip testing", "Use meaningful tests and review changes", "Avoid version control", "Duplicate code quickly"], 1, "Testing and review make changes safer and easier to maintain."),
            (f"What is a useful first step when debugging a {topic} issue?", ["Change many things at once", "Reproduce the issue and inspect the evidence", "Ignore error messages", "Rewrite the whole project"], 1, "A reliable reproduction and evidence help isolate the root cause."),
            (f"Which choice usually makes a {topic} solution easier to maintain?", ["Clear names and small focused functions", "More hidden side effects", "No documentation", "One very large function"], 0, "Focused functions and clear names reduce cognitive load."),
            (f"When evaluating a {topic} solution, which trade-off matters most?", ["Only code length", "Correctness, performance, and maintainability", "File color", "Keyboard speed"], 1, "Good engineering weighs correct behavior, speed, and future change cost."),
            (f"What should you do before deploying a {topic} change?", ["Test the change and check its expected impact", "Deploy without review", "Delete logs", "Avoid monitoring"], 0, "Testing and impact checks reduce deployment risk."),
            (f"Which habit helps a team collaborate on {topic} work?", ["Small reviewed commits with context", "Keeping changes secret", "Skipping communication", "Overwriting teammates' work"], 0, "Small reviewed commits make work visible and recoverable."),
            (f"What makes an error message useful in a {topic} application?", ["It is vague", "It describes the problem and next action", "It hides all details", "It only uses codes"], 1, "Actionable errors help users and developers respond correctly."),
            (f"How should you handle an unfamiliar {topic} requirement?", ["Assume the details", "Clarify acceptance criteria and edge cases", "Ignore it", "Copy unrelated code"], 1, "Clarifying expected behavior prevents expensive rework."),
            (f"What is a good way to learn a new {topic} concept?", ["Build a small example and explain the result", "Memorize without practice", "Avoid feedback", "Only read headings"], 0, "Hands-on examples reveal gaps and build recall."),
            (f"Which outcome shows a strong {topic} solution?", ["It works only once", "It is correct, understandable, and tested", "It has the most files", "It avoids users"], 1, "A strong solution is reliable, readable, and validated."),
        ]

    if not questions:
        return {"error": "Choose Aptitude, Reasoning, or Technical for the mock test.", "questions": []}

    selected = []
    for index in range(question_count):
        question, options, correct_index, explanation = questions[index % len(questions)]
        selected.append({"id": index + 1, "question": question, "options": options, "correct_index": correct_index, "explanation": explanation})
    return {"category": normalized_category.title(), "skill": skill.strip(), "questions": selected, "source": "practice generator"}


def generate_mock_test(category: str, skill: str, question_count: int = 10) -> dict:
    normalized_category = str(category or "").strip().lower()
    normalized_skill = str(skill or "").strip()
    if normalized_category not in {"aptitude", "reasoning", "technical"}:
        return {"error": "Choose Aptitude, Reasoning, or Technical for the mock test.", "questions": []}
    if normalized_category == "technical" and not normalized_skill:
        return {"error": "Choose a technical skill before generating this test.", "questions": []}

    question_count = max(10, min(20, int(question_count or 10)))
    client = _client()
    if client is None:
        return _fallback_mock_test(normalized_category, normalized_skill, question_count)

    focus = normalized_skill if normalized_category == "technical" else normalized_category
    prompt = f'''You create fair placement-preparation MCQ tests. Generate {question_count} {normalized_category} questions focused on {focus}.
Return ONLY a JSON object: {{"questions":[{{"question":"...","options":["...","...","...","..."],"correct_index":0,"explanation":"..."}}]}}.
Rules: exactly four options per question; correct_index is 0 to 3; exactly {question_count} questions; avoid duplicates; use clear beginner-to-intermediate difficulty; explanations are one sentence.'''
    try:
        response = client.chat.completions.create(
            model=os.getenv("CHATGPT_MODEL", os.getenv("OPENAI_ROADMAP_MODEL", "gpt-4o-mini")),
            messages=[{"role": "user", "content": prompt}],
            response_format={"type": "json_object"},
            temperature=0.5,
        )
        payload = _extract_json_object(response.choices[0].message.content or "{}")
        questions = []
        for index, item in enumerate(payload.get("questions", [])):
            options = item.get("options", []) if isinstance(item, dict) else []
            correct_index = item.get("correct_index", -1) if isinstance(item, dict) else -1
            if len(options) == 4 and isinstance(correct_index, int) and 0 <= correct_index < 4 and item.get("question"):
                questions.append({"id": index + 1, "question": str(item["question"]), "options": [str(option) for option in options], "correct_index": correct_index, "explanation": str(item.get("explanation") or "Review this concept before your next attempt.")})
        if len(questions) >= 10:
            return {"category": normalized_category.title(), "skill": normalized_skill, "questions": questions[:question_count], "source": "AI generated"}
    except Exception:
        pass
    return _fallback_mock_test(normalized_category, normalized_skill, question_count)
