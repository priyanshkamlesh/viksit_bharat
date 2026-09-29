from typing import List, Dict


# --------------------------------------------------
# ROADMAP CONTENT
# --------------------------------------------------

ROADMAP_CONTENT = {
    "problem solving": {
        "title": "Problem Solving & DSA",
        "description": "Build algorithmic thinking and improve your ability to solve programming problems.",
        "topics": [
            "Time and Space Complexity",
            "Arrays and Strings",
            "Hashing",
            "Linked Lists",
            "Stacks and Queues",
            "Trees",
            "Graphs",
            "Searching and Sorting"
        ],
        "practice": [
            "Solve 2 easy problems",
            "Solve 2 medium problems",
            "Implement common data structures",
            "Practice pattern-based problems"
        ],
        "assessment": "DSA Skill Assessment"
    },

    "git": {
        "title": "Git & GitHub",
        "description": "Learn version control and professional GitHub workflows.",
        "topics": [
            "Git fundamentals",
            "Repositories",
            "Branches",
            "Commits",
            "Merge and Rebase",
            "Pull Requests",
            "GitHub collaboration"
        ],
        "practice": [
            "Create a Git repository",
            "Create and merge a branch",
            "Push a project to GitHub",
            "Create a Pull Request"
        ],
        "assessment": "Git & GitHub Assessment"
    },

    "mongodb": {
        "title": "MongoDB",
        "description": "Build practical database skills using MongoDB.",
        "topics": [
            "MongoDB fundamentals",
            "Databases and Collections",
            "Documents",
            "CRUD operations",
            "Queries",
            "Indexes",
            "Aggregation",
            "MongoDB with backend applications"
        ],
        "practice": [
            "Create a MongoDB database",
            "Perform CRUD operations",
            "Build MongoDB queries",
            "Connect MongoDB to a backend API"
        ],
        "assessment": "MongoDB Assessment"
    },

    "sql": {
        "title": "SQL",
        "description": "Develop the ability to work with relational databases and write efficient SQL queries.",
        "topics": [
            "SQL fundamentals",
            "SELECT queries",
            "Filtering and Sorting",
            "GROUP BY and HAVING",
            "JOINs",
            "Subqueries",
            "Indexes",
            "Database normalization"
        ],
        "practice": [
            "Write basic SELECT queries",
            "Practice JOIN queries",
            "Solve aggregation problems",
            "Build queries from real datasets"
        ],
        "assessment": "SQL Skill Assessment"
    },

    "communication": {
        "title": "Communication",
        "description": "Improve professional communication for interviews, teamwork and workplace situations.",
        "topics": [
            "Professional communication",
            "Technical explanation",
            "Interview communication",
            "Presentation skills",
            "Active listening",
            "Professional writing"
        ],
        "practice": [
            "Explain one technical concept aloud",
            "Practice a mock interview answer",
            "Give a short project presentation",
            "Write a professional introduction"
        ],
        "assessment": "Communication Assessment"
    },

    "rest apis": {
        "title": "REST APIs",
        "description": "Strengthen your ability to design, consume and secure REST APIs.",
        "topics": [
            "HTTP fundamentals",
            "REST architecture",
            "HTTP methods",
            "Status codes",
            "Request and Response",
            "Authentication",
            "Authorization",
            "API error handling"
        ],
        "practice": [
            "Build a CRUD REST API",
            "Connect a frontend to an API",
            "Implement authentication",
            "Handle API errors correctly"
        ],
        "assessment": "REST API Assessment"
    },

    "javascript": {
        "title": "JavaScript",
        "description": "Strengthen core JavaScript concepts used in modern web development.",
        "topics": [
            "Variables and Data Types",
            "Functions",
            "Arrays and Objects",
            "ES6+",
            "Promises",
            "Async/Await",
            "DOM",
            "Modules"
        ],
        "practice": [
            "Solve JavaScript problems",
            "Build small JavaScript utilities",
            "Work with asynchronous APIs",
            "Build a small frontend feature"
        ],
        "assessment": "JavaScript Assessment"
    },

    "react": {
        "title": "React",
        "description": "Build production-oriented React development skills.",
        "topics": [
            "Components",
            "Props",
            "State",
            "Hooks",
            "Forms",
            "API integration",
            "Routing",
            "Performance"
        ],
        "practice": [
            "Build reusable components",
            "Create a form",
            "Consume a REST API",
            "Build a multi-page React feature"
        ],
        "assessment": "React Assessment"
    },

    "node.js": {
        "title": "Node.js",
        "description": "Strengthen backend development skills using Node.js.",
        "topics": [
            "Node.js fundamentals",
            "Modules",
            "Express",
            "Middleware",
            "REST APIs",
            "Authentication",
            "Error handling",
            "Environment variables"
        ],
        "practice": [
            "Create a Node.js server",
            "Build a REST API",
            "Add authentication",
            "Connect the API to a database"
        ],
        "assessment": "Node.js Assessment"
    }
}


# --------------------------------------------------
# SKILL NORMALIZATION
# --------------------------------------------------

def normalize_skill(skill: str) -> str:
    if not skill:
        return ""

    skill = skill.strip().lower()

    aliases = {
        "react.js": "react",
        "reactjs": "react",
        "node": "node.js",
        "nodejs": "node.js",
        "rest api": "rest apis",
        "restful api": "rest apis",
        "restful apis": "rest apis",
        "dsa": "problem solving",
        "problem-solving": "problem solving",
        "mongodb database": "mongodb",
    }

    return aliases.get(skill, skill)


# --------------------------------------------------
# GENERATE ROADMAP
# --------------------------------------------------

def generate_career_roadmap(
    target_role: str,
    skill_gaps: List[Dict]
) -> Dict:

    roadmap = []

    for index, gap in enumerate(skill_gaps):

        skill = normalize_skill(
            gap.get("skill", "")
        )

        if not skill:
            continue

        required = float(
            gap.get("required", 0) or 0
        )

        current = float(
            gap.get("current", 0) or 0
        )

        gap_value = float(
            gap.get("gap", 0) or 0
        )

        priority = (
            gap.get("priority", "low") or "low"
        ).lower()

        content = ROADMAP_CONTENT.get(
            skill,
            {
                "title": skill.title(),
                "description": (
                    f"Improve your {skill.title()} "
                    f"skills for the {target_role} role."
                ),
                "topics": [
                    f"{skill.title()} fundamentals",
                    f"{skill.title()} practical concepts",
                    f"{skill.title()} advanced concepts"
                ],
                "practice": [
                    f"Practice {skill.title()} problems",
                    f"Build a small {skill.title()} project",
                    f"Apply {skill.title()} in a real project"
                ],
                "assessment": (
                    f"{skill.title()} Skill Assessment"
                )
            }
        )

        if priority == "high":
            priority_order = 1
        elif priority == "medium":
            priority_order = 2
        else:
            priority_order = 3

        roadmap.append({
            "order": 0,
            "skill": skill,
            "title": content["title"],
            "priority": priority,
            "priority_order": priority_order,

            "current_level": round(current, 2),
            "target_level": round(required, 2),
            "gap": round(gap_value, 2),

            "description": content["description"],

            "topics": content["topics"],

            "practice_tasks": content["practice"],

            "assessment": content["assessment"],

            "status": "not_started",

            "progress": 0
        })

    # High priority first, then largest gap
    roadmap.sort(
        key=lambda item: (
            item["priority_order"],
            -item["gap"]
        )
    )

    # Assign roadmap order after sorting
    for index, item in enumerate(roadmap):
        item["order"] = index + 1

    return {
        "target_role": target_role,
        "total_gaps": len(roadmap),
        "roadmap": roadmap
    }