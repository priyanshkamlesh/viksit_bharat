"""
Regex-based resume detail extractor.
Extracts structured fields (name, email, phone, location, links, sections)
from plain-text resume content without requiring an LLM call.
"""

import re
from typing import Dict, Optional


# ── Contact field patterns ──────────────────────────────────────────────
EMAIL_PATTERN = re.compile(
    r"(?:Email\s*[:：]?\s*)?([\w.+-]+@[\w.-]+\.\w{2,})", re.IGNORECASE
)

PHONE_PATTERN = re.compile(
    r"(?:Phone|Tel|Mobile|Cell|Contact)[:\s]*(?:No[.:\s]*)?([+\d][\d\s().\-+]{7,18}\d)",
    re.IGNORECASE,
)

# Fallback phone: look for any standalone phone-like number
PHONE_FALLBACK = re.compile(
    r"(?:(?:\+?91[\-\s]?)?(?:\(?\d{3,5}\)?[\-\s]?)?\d{3}[\-\s]?\d{4})"
    r"|(?:\+\d{1,3}[\-\s]?(?:\(\d{1,4}\)[\-\s]?)?\d{5,10})"
    r"|(?:\d{3}[\-\s]\d{3}[\-\s]\d{4})",
)

LINKEDIN_PATTERN = re.compile(
    r"(?:linkedin\.com/in/|linkedin\.com/pub/|linkedin:\s*)([\w\-%]+)",
    re.IGNORECASE,
)

GITHUB_PATTERN = re.compile(
    r"(?:github\.com/|github:\s*)([\w\-.]+)",
    re.IGNORECASE,
)

PORTFOLIO_PATTERN = re.compile(
    r"(?:portfolio|website|web|site)[:\s]*(https?://[^\s,;]+)",
    re.IGNORECASE,
)

# Generic URL scanner
URL_PATTERN = re.compile(r"https?://[^\s,;]+")


def _extract_email(text: str) -> str:
    m = EMAIL_PATTERN.search(text)
    return m.group(1).strip() if m else ""


def _extract_phone(text: str) -> str:
    # Try labelled phone first
    m = PHONE_PATTERN.search(text)
    if m:
        return m.group(1).strip()
    # Fallback: first standalone phone-like number in the first 500 chars
    header = text[:500]
    m = PHONE_FALLBACK.search(header)
    if m:
        raw = m.group(0).strip()
        # Filter out things that are clearly not phone numbers
        if len(re.sub(r"\D", "", raw)) >= 10:
            return raw
    return ""


def _extract_location(text: str) -> str:
    loc_patterns = [
        r"(?:Location|Address|Based in|City)[:\s]*([^\n]{3,60})",
        r"(?i)([A-Z][a-z]{2,25},\s*(?:[A-Z]{2}|[A-Z][a-z]{2,25})(?:,\s*(?:\d{5,7}|[A-Z]{1,3}))?)",
    ]
    for pattern in loc_patterns:
        m = re.search(pattern, text)
        if m:
            return m.group(1).strip().rstrip(".,;")
    return ""


def _extract_linkedin(text: str) -> str:
    m = LINKEDIN_PATTERN.search(text)
    if m:
        return f"linkedin.com/in/{m.group(1)}"
    # Full URL fallback
    m = re.search(r"https?://(?:www\.)?linkedin\.com/in/[\w\-%]+", text, re.IGNORECASE)
    return m.group(0) if m else ""


def _extract_github(text: str) -> str:
    m = GITHUB_PATTERN.search(text)
    if m:
        return f"github.com/{m.group(1)}"
    m = re.search(r"https?://(?:www\.)?github\.com/[\w\-.]+", text, re.IGNORECASE)
    return m.group(0) if m else ""


def _extract_portfolio(text: str) -> str:
    m = PORTFOLIO_PATTERN.search(text)
    if m:
        return m.group(1).strip()
    return ""


def _extract_name(text: str, email: str) -> str:
    """
    Heuristic: first non-empty line that looks like a person's name,
    typically at the top of the resume before contact details.
    """
    lines = [line.strip() for line in text.split("\n") if line.strip()]
    # Skip very short/long lines, lines with common resume headers, lines with numbers only
    skip_patterns = [
        r"^(resume|curriculum\s*vitae|cv|profile)$",
        r"^(summary|objective|experience|education|skills?|projects?|certifications?|awards?|references?)$",
        r"^(contact|personal\s*info|details|links?)$",
        r"^[+\d\s().\-@]{8,}$",  # phone / email
        r"^https?://",
        r"^(linkedin|github|portfolio)",
        r"^(software|senior|junior|lead|principal|staff|engineer|developer|designer|manager|analyst|intern|student)",
    ]
    skip_re = re.compile("|".join(skip_patterns), re.IGNORECASE)

    name_candidates = []
    for line in lines[:20]:  # first 20 non-empty lines
        if skip_re.match(line):
            continue
        # Name lines: 2-3 words, each starting with capital letter, 2-25 chars per word
        words = line.split()
        if 2 <= len(words) <= 4 and all(
            2 <= len(w) <= 25 and (w[0].isupper() or w[0].isdigit()) for w in words
        ):
            # Exclude lines that are entirely ALL CAPS section headers
            if not line.isupper():
                name_candidates.append(line)
                break

    if name_candidates:
        return name_candidates[0]

    # Fallback: derive from email (first.last@domain.com → First Last)
    if email and "@" in email:
        local = email.split("@")[0]
        # Replace common separators with spaces
        local = re.sub(r"[._+\-]", " ", local)
        parts = local.split()
        if len(parts) >= 2:
            return " ".join(p.capitalize() for p in parts[:3])

    return ""


# ── Section extraction ──────────────────────────────────────────────────

SECTION_HEADERS = {
    "summary": [
        r"^(?:professional\s*)?summary",
        r"^objective",
        r"^profile",
        r"^about(?:\s*me)?",
        r"^career\s*objective",
        r"^personal\s*statement",
    ],
    "skills": [
        r"^(?:technical\s*)?skills?",
        r"^technologies",
        r"^tools?\s*&?\s*technologies",
        r"^core\s*competenc",
        r"^languages?\s*&?\s*frameworks",
        r"^tech\s*stack",
    ],
    "experience": [
        r"^(?:work|professional|relevant|industry)\s*experience",
        r"^employment",
        r"^work\s*history",
        r"^internships?",
        r"^professional\s*background",
        r"^positions?\s*held",
    ],
    "education": [
        r"^education",
        r"^academic",
        r"^qualification",
        r"^degrees?",
        r"^studies",
    ],
    "projects": [
        r"^projects?",
        r"^personal\s*projects?",
        r"^academic\s*projects?",
        r"^portfolio",
        r"^project\s*experience",
        r"^key\s*projects?",
    ],
    "certifications": [
        r"^certifications?",
        r"^certificates?",
        r"^licenses?",
        r"^credentials",
        r"^professional\s*certifications?",
    ],
}

# Lines that signal a new section → stop collecting
ALL_SECTION_STARTS = set()
for patterns in SECTION_HEADERS.values():
    for p in patterns:
        ALL_SECTION_STARTS.add(p)


def _extract_section(text: str, header_patterns: list, stop_headers: set) -> str:
    """Extract the content between a matching section header and the next section header."""
    lines = text.split("\n")
    content_lines = []
    in_section = False

    for line in lines:
        stripped = line.strip().lower()
        # Check if this line starts a relevant section
        if any(re.match(pat, stripped) for pat in header_patterns):
            in_section = True
            # Include the header line itself? No, skip it
            continue

        # Stop if we hit another section header
        if in_section and any(re.match(pat, stripped) for pat in stop_headers):
            in_section = False
            break

        if in_section and line.strip():
            content_lines.append(line.strip())

    return "\n".join(content_lines).strip()


def _extract_all_section_stop_patterns() -> set:
    """Build combined set of all section-start regex patterns."""
    all_patterns = set()
    for patterns in SECTION_HEADERS.values():
        all_patterns.update(patterns)
    return all_patterns


def _extract_skills_text(text: str) -> str:
    """Extract skills section as a text block, then format as comma-separated list."""
    STOP_HEADERS = _extract_all_section_stop_patterns()
    raw = _extract_section(text, SECTION_HEADERS["skills"], STOP_HEADERS)
    if not raw:
        return ""

    # Skills sections often have lists/columns; join lines into comma-separated
    # Normalize bullet points and multi-column layouts
    cleaned = re.sub(r"[•\-\*\u2022]", ",", raw)
    cleaned = re.sub(r"\s{2,}", " ", cleaned)
    parts = [p.strip().rstrip(".,;") for p in cleaned.split(",") if p.strip()]
    # Deduplicate while preserving order
    seen = set()
    unique = []
    for p in parts:
        key = p.lower()
        if key not in seen and len(p) > 1:
            seen.add(key)
            unique.append(p)
    return ", ".join(unique)


def parse_resume_details(resume_text: str) -> Dict:
    """
    Parse a raw resume text string and return structured details.

    Returns a dict with keys matching ResumeGenerateRequest fields:
        full_name, email, phone, location, linkedin_url, github_url,
        summary, skills, education, experience, projects, certifications
    """
    if not resume_text or not resume_text.strip():
        return {}

    text = resume_text.strip()
    # Normalize line endings and collapse excessive whitespace (but preserve line breaks)
    text = re.sub(r"\r\n|\r", "\n", text)
    text = re.sub(r"\n{3,}", "\n\n", text)

    email = _extract_email(text)
    phone = _extract_phone(text)

    details = {
        "full_name": _extract_name(text, email),
        "email": email,
        "phone": phone,
        "location": _extract_location(text),
        "linkedin_url": _extract_linkedin(text),
        "github_url": _extract_github(text),
    }

    # Extract sections
    STOP_HEADERS = _extract_all_section_stop_patterns()

    details["summary"] = _extract_section(text, SECTION_HEADERS["summary"], STOP_HEADERS)
    details["skills"] = _extract_skills_text(text)
    details["education"] = _extract_section(text, SECTION_HEADERS["education"], STOP_HEADERS)
    details["experience"] = _extract_section(text, SECTION_HEADERS["experience"], STOP_HEADERS)
    details["projects"] = _extract_section(text, SECTION_HEADERS["projects"], STOP_HEADERS)
    details["certifications"] = _extract_section(text, SECTION_HEADERS["certifications"], STOP_HEADERS)

    # If portfolio/github wasn't found in the link extraction, scan URLs
    if not details["github_url"]:
        # Look for github in links
        for url in URL_PATTERN.findall(text):
            if "github.com" in url.lower():
                details["github_url"] = url
                break

    # Remove empty strings for cleaner output
    return {k: v for k, v in details.items() if v}