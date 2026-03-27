import json
import os
import re
from pathlib import Path

from dotenv import load_dotenv

try:
    import networkx as nx
except ImportError:  # pragma: no cover - fallback graph implementation
    nx = None

try:
    from openai import OpenAI
except ImportError:  # pragma: no cover - handled by fallback roadmap generation
    OpenAI = None


env_path = Path(__file__).resolve().parent.parent / ".env"
load_dotenv(dotenv_path=env_path)

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY") or os.getenv("OPENAI_API")
client = OpenAI(api_key=OPENAI_API_KEY) if OpenAI and OPENAI_API_KEY else None


class SimpleDiGraph:
    def __init__(self):
        self._nodes = {}
        self._edges = []
        self._incoming = {}
        self._outgoing = {}

    def add_node(self, node_id, **attrs):
        self._nodes[node_id] = {**self._nodes.get(node_id, {}), **attrs}
        self._incoming.setdefault(node_id, set())
        self._outgoing.setdefault(node_id, set())

    def add_edge(self, source, target):
        self._edges.append((source, target))
        self._outgoing.setdefault(source, set()).add(target)
        self._incoming.setdefault(target, set()).add(source)
        self._incoming.setdefault(source, set())
        self._outgoing.setdefault(target, set())

    def nodes(self, data=False):
        return self._nodes.items() if data else self._nodes.keys()

    def get_node_attrs(self, node_id):
        return self._nodes.get(node_id, {})

    def edges(self):
        return list(self._edges)

    def predecessors(self, node_id):
        return list(self._incoming.get(node_id, set()))

    def number_of_nodes(self):
        return len(self._nodes)

    def in_degree(self, node_id):
        return len(self._incoming.get(node_id, set()))

    def outgoing(self, node_id):
        return list(self._outgoing.get(node_id, set()))


def _humanize_skill(skill: str) -> str:
    if not skill:
        return "Skill Roadmap"

    title = skill.replace("-", " ").replace("_", " ").strip()
    title = re.sub(r"\s+", " ", title)
    return title.title()


def _slugify(value: str) -> str:
    slug = value.lower().replace("&", " and ")
    slug = re.sub(r"[^a-z0-9]+", "-", slug)
    return slug.strip("-") or "node"


def _build_fallback_tree(skill: str, level: str | None):
    normalized = (skill or "").lower()
    title = _humanize_skill(skill)

    if any(keyword in normalized for keyword in ["full stack", "full-stack", "fullstack", "mern"]):
        branches = [
            {
                "title": "Frontend",
                "description": "Build the user-facing part of the app.",
                "items": ["HTML", "CSS", "JavaScript", "React", "Responsive UI"],
                "children": [
                    {"title": "HTML", "items": ["Semantic tags", "forms", "accessibility"]},
                    {"title": "CSS", "items": ["Flexbox", "Grid", "responsive design"]},
                    {"title": "JavaScript", "items": ["DOM", "events", "async patterns"]},
                    {"title": "React", "items": ["components", "state", "hooks"]},
                ],
            },
            {
                "title": "Backend",
                "description": "Build APIs and business logic.",
                "items": ["Node.js", "Express.js", "REST APIs", "Authentication", "Validation"],
                "children": [
                    {"title": "Node.js", "items": ["runtime", "npm", "event loop"]},
                    {"title": "Express.js", "items": ["routing", "middleware", "controllers"]},
                    {"title": "REST APIs", "items": ["CRUD", "status codes", "request flow"]},
                    {"title": "Auth", "items": ["JWT", "sessions", "authorization"]},
                ],
            },
            {
                "title": "Database",
                "description": "Store and shape application data.",
                "items": ["MongoDB", "SQL", "schema design", "indexes", "queries"],
                "children": [
                    {"title": "MongoDB", "items": ["documents", "collections", "aggregation"]},
                    {"title": "SQL", "items": ["joins", "grouping", "window functions"]},
                    {"title": "Schema Design", "items": ["relations", "constraints", "normalization"]},
                ],
            },
            {
                "title": "Deployment",
                "description": "Ship and maintain the app.",
                "items": ["Git", "CI/CD", "hosting", "monitoring", "performance"],
                "children": [
                    {"title": "Git & GitHub", "items": ["branches", "pull requests", "reviews"]},
                    {"title": "CI/CD", "items": ["pipelines", "tests", "deployments"]},
                    {"title": "Monitoring", "items": ["logs", "metrics", "alerts"]},
                ],
            },
        ]
    elif "react" in normalized:
        branches = [
            {
                "title": "Foundations",
                "description": "Learn the base JavaScript and component model.",
                "items": ["JSX", "components", "props", "state"],
                "children": [
                    {"title": "JSX", "items": ["syntax", "expressions", "rendering"]},
                    {"title": "Components", "items": ["composition", "reusability", "structure"]},
                    {"title": "State", "items": ["useState", "updates", "data flow"]},
                ],
            },
            {
                "title": "Routing & Data",
                "description": "Connect pages and API data.",
                "items": ["React Router", "fetch", "forms", "async data"],
                "children": [
                    {"title": "React Router", "items": ["routes", "params", "navigation"]},
                    {"title": "API Calls", "items": ["fetch", "loading states", "errors"]},
                    {"title": "Forms", "items": ["controlled inputs", "validation", "submit flow"]},
                ],
            },
            {
                "title": "Advanced React",
                "description": "Move toward production-ready patterns.",
                "items": ["hooks", "performance", "state management", "testing"],
                "children": [
                    {"title": "Hooks", "items": ["useEffect", "useMemo", "custom hooks"]},
                    {"title": "Performance", "items": ["memoization", "render control", "splitting"]},
                    {"title": "Testing", "items": ["component tests", "integration tests"]},
                ],
            },
        ]
    elif "python" in normalized:
        branches = [
            {
                "title": "Python Basics",
                "description": "Get comfortable with the language syntax.",
                "items": ["variables", "loops", "functions", "collections"],
                "children": [
                    {"title": "Syntax", "items": ["indentation", "types", "control flow"]},
                    {"title": "Functions", "items": ["parameters", "returns", "scope"]},
                    {"title": "Collections", "items": ["lists", "dicts", "sets"]},
                ],
            },
            {
                "title": "Practical Python",
                "description": "Use Python for real tasks.",
                "items": ["files", "modules", "APIs", "automation"],
                "children": [
                    {"title": "Files", "items": ["read/write", "paths", "exceptions"]},
                    {"title": "Modules", "items": ["imports", "packages", "virtual envs"]},
                    {"title": "Automation", "items": ["scripts", "CLI tools", "jobs"]},
                ],
            },
            {
                "title": "Projects",
                "description": "Turn learning into useful work.",
                "items": ["mini apps", "backend", "data tasks"],
                "children": [
                    {"title": "CLI App", "items": ["input", "processing", "output"]},
                    {"title": "Backend API", "items": ["FastAPI", "routing", "responses"]},
                    {"title": "Data Project", "items": ["pandas", "analysis", "reporting"]},
                ],
            },
        ]
    else:
        branches = [
            {
                "title": "Foundations",
                "description": f"Start with the core ideas behind {title}.",
                "items": ["basics", "tools", "terminology"],
                "children": [
                    {"title": "Core Concepts", "items": ["definitions", "mental model", "workflow"]},
                    {"title": "Practice", "items": ["guided exercises", "notes", "small tasks"]},
                ],
            },
            {
                "title": "Intermediate",
                "description": f"Build confidence by connecting the basics of {title}.",
                "items": ["patterns", "projects", "problem solving"],
                "children": [
                    {"title": "Patterns", "items": ["reusable steps", "common use cases"]},
                    {"title": "Mini Projects", "items": ["end-to-end practice", "review"]},
                ],
            },
            {
                "title": "Advanced",
                "description": f"Prepare for real-world use of {title}.",
                "items": ["quality", "debugging", "portfolio work"],
                "children": [
                    {"title": "Production Skills", "items": ["testing", "deployment", "maintenance"]},
                    {"title": "Capstone Project", "items": ["build", "ship", "iterate"]},
                ],
            },
        ]

    return {
        "title": title,
        "summary": f"A branching roadmap for {title}{f' at {level} level' if level else ''}.",
        "branches": branches,
    }


def _enrich_tree_node(node: dict, path: str) -> dict:
    node_title = node.get("title", "Untitled")
    node_slug = _slugify(node_title)
    node_id = path or node_slug
    children = []

    for index, child in enumerate(node.get("children", []) or []):
        child_path = f"{node_id}-{_slugify(child.get('title', f'child-{index + 1}'))}"
        children.append(_enrich_tree_node(child, child_path))

    return {
        "id": node_id,
        "title": node_title,
        "description": node.get("description", ""),
        "items": node.get("items", []) or [],
        "children": children,
    }


def _enrich_tree(payload: dict) -> dict:
    return {
        **payload,
        "branches": [
            _enrich_tree_node(branch, _slugify(branch.get("title", f"branch-{index + 1}")))
            for index, branch in enumerate(payload.get("branches", []) or [])
        ],
    }


def _collect_leaf_ids(branches: list[dict]) -> list[str]:
    leaf_ids = []

    def walk(node: dict):
        children = node.get("children", []) or []
        if not children:
            node_id = node.get("id")
            if node_id:
                leaf_ids.append(node_id)
            return

        for child in children:
            walk(child)

    for branch in branches:
        walk(branch)

    return leaf_ids


def _prompt_for_tree(skill: str, level: str | None) -> str:
    readable_skill = _humanize_skill(skill)
    readable_level = level or "all levels"
    return f"""
You are generating a learning roadmap as a hierarchical tree.

Skill: {readable_skill}
Level: {readable_level}

Return ONLY valid JSON matching this schema:
{{
  "title": "Root title",
  "summary": "Short summary",
  "branches": [
    {{
      "title": "Top level branch",
      "description": "Short description",
      "items": ["topic 1", "topic 2", "topic 3"],
      "children": [
        {{
          "title": "Subtopic",
          "items": ["item 1", "item 2"]
        }}
      ]
    }}
  ]
}}

Rules:
- Produce 3 to 5 top-level branches.
- Each branch should have 3 to 5 child topics.
- Keep the structure ordered from foundation to project work.
- For Full Stack, always include Frontend, Backend, Database, and Deployment branches.
- For Full Stack frontend, include HTML, CSS, JavaScript, and React as child topics.
- Use concise labels that look good in a flowchart.
"""


def _generate_tree_with_ai(skill: str, level: str | None):
    if not client:
        raise RuntimeError("OpenAI client is unavailable")

    response = client.chat.completions.create(
        model=os.getenv("OPENAI_ROADMAP_MODEL", "gpt-4o-mini"),
        messages=[{"role": "user", "content": _prompt_for_tree(skill, level)}],
        response_format={"type": "json_object"},
    )

    content = response.choices[0].message.content or "{}"
    payload = json.loads(content)
    if "branches" not in payload:
        raise ValueError("AI roadmap payload missing branches")
    return payload


def _build_network(graph_root_title: str, payload: dict):
    graph = nx.DiGraph() if nx else SimpleDiGraph()
    root_id = "root"

    graph.add_node(
        root_id,
        title=graph_root_title,
        description=payload.get("summary", ""),
        items=[],
        level=0,
        kind="root",
    )

    def add_branch(parent_id: str, branch: dict, path: str, depth: int):
        node_id = path
        graph.add_node(
            node_id,
            title=branch.get("title", "Untitled"),
            description=branch.get("description", ""),
            items=branch.get("items", []) or [],
            level=depth,
            kind="branch" if branch.get("children") else "leaf",
        )
        graph.add_edge(parent_id, node_id)

        for index, child in enumerate(branch.get("children", []) or []):
            child_slug = _slugify(child.get("title", f"child-{index + 1}"))
            add_branch(node_id, child, f"{node_id}-{child_slug}", depth + 1)

    for index, branch in enumerate(payload.get("branches", []) or []):
        branch_slug = _slugify(branch.get("title", f"branch-{index + 1}"))
        add_branch(root_id, branch, branch_slug, 1)

    return graph


def _topological_sort(graph):
    if nx:
        return list(nx.topological_sort(graph))

    nodes = set(graph.nodes())
    incoming = {node: set(graph.predecessors(node)) for node in nodes}
    ready = [node for node in nodes if not incoming[node]]
    ordered = []

    while ready:
        node = ready.pop(0)
        ordered.append(node)

        for child in graph.outgoing(node):
            incoming[child].discard(node)
            if not incoming[child] and child not in ordered and child not in ready:
                ready.append(child)

    return ordered


def _graph_to_mermaid(graph, leaf_ids=None) -> str:
    lines = ["flowchart TD"]
    for node_id, data in graph.nodes(data=True):
        label = data.get("title", node_id).replace('"', '\\"')
        lines.append(f'  {node_id}["{label}"]')

    for source, target in graph.edges():
        lines.append(f"  {source} --> {target}")

    leaf_ids = leaf_ids or []
    if leaf_ids:
        lines.append("  classDef leafNode fill:#ecfdf5,stroke:#10b981,color:#064e3b,stroke-width:2px;")
        lines.append(f"  class {','.join(leaf_ids)} leafNode")

    return "\n".join(lines)


def _graph_to_nodes(graph):
    ordered_nodes = _topological_sort(graph) if graph.number_of_nodes() else []
    nodes = []

    for node_id in ordered_nodes:
        data = graph.get_node_attrs(node_id) if hasattr(graph, "get_node_attrs") else graph.nodes[node_id]
        parents = list(graph.predecessors(node_id))
        nodes.append(
            {
                "id": node_id,
                "title": data.get("title", node_id),
                "description": data.get("description", ""),
                "items": data.get("items", []),
                "level": data.get("level", 0),
                "kind": data.get("kind", "leaf"),
                "depends_on": parents,
            }
        )

    edges = [{"source": source, "target": target} for source, target in graph.edges()]
    return nodes, edges


def generate_roadmap(skill: str, level: str | None):
    skill_title = _humanize_skill(skill)

    try:
        payload = _generate_tree_with_ai(skill, level)
    except Exception as error:
        print("AI roadmap generation failed, using fallback:", error)
        payload = _build_fallback_tree(skill, level)

    enriched_tree = _enrich_tree(payload)
    leaf_ids = _collect_leaf_ids(enriched_tree.get("branches", []))
    graph = _build_network(skill_title, payload)
    nodes, edges = _graph_to_nodes(graph)

    steps = [
        {
            "id": node["id"],
            "title": node["title"],
            "description": node["description"],
            "items": node["items"],
            "depends_on": node["depends_on"],
            "level": node["level"],
            "kind": node["kind"],
        }
        for node in nodes
        if node["id"] != "root"
    ]

    return {
        "skill": skill_title,
        "level": level,
        "summary": enriched_tree.get("summary", ""),
        "tree": enriched_tree,
        "structure": enriched_tree,
        "steps": steps,
        "flowchart": {
            "nodes": nodes,
            "edges": edges,
            "mermaid": _graph_to_mermaid(graph, leaf_ids),
        },
    }
