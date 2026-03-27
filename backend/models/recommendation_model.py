import math


def _normalized_text(value):
    return value.strip().lower() if isinstance(value, str) else ""


def _mock_interview_profile(user):
    return user.get("mock_interview", {})


def _interest_overlap(userA, userB):
    interests_a = set(userA.get("interests", []))
    interests_b = set(userB.get("interests", []))
    return len(interests_a.intersection(interests_b))


def _mock_interview_bonus(userA, userB):
    profile_a = _mock_interview_profile(userA)
    profile_b = _mock_interview_profile(userB)
    reasons = []
    score = 0.0

    if not (profile_a.get("enabled") and profile_b.get("enabled")):
        return score, reasons

    score += 0.25
    reasons.append("Both users are open to mock interviews")

    role_a = _normalized_text(profile_a.get("target_role"))
    role_b = _normalized_text(profile_b.get("target_role"))
    if role_a and role_a == role_b:
        score += 0.2
        reasons.append("Targeting the same interview role")

    level_a = _normalized_text(profile_a.get("experience_level"))
    level_b = _normalized_text(profile_b.get("experience_level"))
    if level_a and level_a == level_b:
        score += 0.15
        reasons.append("Similar interview experience level")

    focus_a = set(profile_a.get("focus_areas", []))
    focus_b = set(profile_b.get("focus_areas", []))
    shared_focus = focus_a.intersection(focus_b)
    if shared_focus:
        score += min(len(shared_focus) * 0.08, 0.24)
        reasons.append(
            "Shared mock interview focus: " + ", ".join(sorted(shared_focus))
        )

    return score, reasons

# ---------------------------
# Build feature vector
# ---------------------------
def create_vector(user, all_skills):
    vector = []

    # Skill scores
    for skill in all_skills:
        vector.append(user["skills"].get(skill, 0))

    # Goal encoding (simple hash encoding)
    vector.append(hash(user["goal"]) % 10)

    # Location encoding
    vector.append(hash(user["location"]) % 10)

    return vector


# ---------------------------
# AI similarity
# ---------------------------
def ai_similarity(vecA, vecB):
    dot_product = sum(a * b for a, b in zip(vecA, vecB))
    magnitude_a = math.sqrt(sum(a * a for a in vecA))
    magnitude_b = math.sqrt(sum(b * b for b in vecB))

    if magnitude_a == 0 or magnitude_b == 0:
        return 0.0

    return dot_product / (magnitude_a * magnitude_b)


# ---------------------------
# Complementarity (learning)
# ---------------------------
def complementarity(userA, userB):
    common = set(userA["skills"]).intersection(userB["skills"])
    score = 0
    reasons = []

    for skill in common:
        diff = abs(userA["skills"][skill] - userB["skills"][skill])

        if 20 <= diff <= 60:
            score += 1
            reasons.append(f"Complementary levels in {skill}")

    return min(score, 2), reasons


# ---------------------------
# Final scoring
# ---------------------------
def calculate_score(userA, userB, all_skills):
    reasons = []

    vecA = create_vector(userA, all_skills)
    vecB = create_vector(userB, all_skills)

    ai_score = ai_similarity(vecA, vecB)

    comp_score, comp_reasons = complementarity(userA, userB)

    goal_score = 1 if userA["goal"] == userB["goal"] else 0
    if goal_score:
        reasons.append("Same goal")

    loc_score = 1 if userA["location"] == userB["location"] else 0
    if loc_score:
        reasons.append("Same location")

    interest_score = min(_interest_overlap(userA, userB), 2) * 0.1
    if interest_score:
        reasons.append("Shared interests")

    mock_interview_score, mock_reasons = _mock_interview_bonus(userA, userB)
    reasons.extend(mock_reasons)
    reasons.extend(comp_reasons)

    final_score = (
        0.45 * ai_score +
        0.15 * comp_score +
        0.1 * goal_score +
        0.05 * loc_score +
        interest_score +
        mock_interview_score
    )

    return round(final_score, 3), reasons


# ---------------------------
# Recommendation engine
# ---------------------------
def recommend_users(target_user, users):
    results = []

    # collect all skills
    all_skills = set()
    for u in users:
        all_skills.update(u["skills"].keys())

    for user in users:
        if user["id"] == target_user["id"]:
            continue

        score, reasons = calculate_score(target_user, user, all_skills)

        results.append({
            "id": user["id"],
            "name": user["name"],
            "score": score,
            "reasons": reasons
        })

    return sorted(results, key=lambda x: x["score"], reverse=True)[:5]
