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
