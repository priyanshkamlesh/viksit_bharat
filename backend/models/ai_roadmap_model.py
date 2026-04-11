import json
import os
import re
from pathlib import Path

from dotenv import load_dotenv

try:
    import networkx as nx
except ImportError: 
    nx = None

try:
    from openai import OpenAI
except ImportError: 
    OpenAI = None


env_path = Path(__file__).resolve().parent.parent / ".env"
load_dotenv(dotenv_path=env_path)

LEGACY_OPENAI_API_KEY = os.getenv("OPENAI_API_KEY") or os.getenv("OPENAI_API")
client = OpenAI(api_key=LEGACY_OPENAI_API_KEY) if OpenAI and LEGACY_OPENAI_API_KEY else None


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


def _is_retryable_provider_error(error_message: str) -> bool:
    message = (error_message or "").lower()
    retryable_markers = [
        "insufficient_quota",
        "error code: 429",
        "rate limit",
        "quota",
        "temporarily unavailable",
        "service unavailable",
        "timeout",
        "connection",
    ]
    return any(marker in message for marker in retryable_markers)


def _is_quota_error(error_message: str) -> bool:
    message = (error_message or "").lower()
    quota_markers = [
        "insufficient_quota",
        "exceeded your current quota",
        "quota exceeded",
        "quota",
        "billing",
        "credit",
    ]
    return any(marker in message for marker in quota_markers)


def _parse_models(raw: str | None, default_model: str, fallback_models: list[str] | None = None) -> list[str]:
    seen = set()
    models = []
    candidates = []
    if raw:
        candidates.extend(part.strip() for part in raw.split(","))
    candidates.append(default_model)
    if fallback_models:
        candidates.extend(fallback_models)

    for model in candidates:
        if not model:
            continue
        key = model.lower()
        if key in seen:
            continue
        seen.add(key)
        models.append(model)
    return models


class AIProviderFailure(RuntimeError):
    def __init__(self, errors: list[dict]):
        self.errors = errors
        details = " | ".join(f'{e.get("provider")}: {e.get("error")}' for e in errors)
        super().__init__(f"All AI providers failed. {details}")


def _ai_providers():
    if not OpenAI:
        return []

    providers = []
    provider_signatures = set()

    def add_provider(name: str, api_key: str | None, models: list[str], base_url: str | None = None):
        if not api_key:
            return
        signature = (
            (api_key or "").strip(),
            tuple(models),
            (base_url or "").strip(),
        )
        if signature in provider_signatures:
            return
        provider_signatures.add(signature)
        client_kwargs = {"api_key": api_key}
        if base_url:
            client_kwargs["base_url"] = base_url
        providers.append(
            {
                "name": name,
                "base_url": base_url,
                "client": OpenAI(**client_kwargs),
                "models": models,
            }
        )

    # Preferred failover order requested by user.
    add_provider(
        "chatgpt",
        os.getenv("CHATGPT_API_KEY") or os.getenv("OPENAI_API_KEY") or os.getenv("OPENAI_API"),
        _parse_models(
            os.getenv("CHATGPT_MODEL"),
            "gpt-4o-mini",
        ),
        os.getenv("CHATGPT_BASE_URL"),
    )

    add_provider(
        "gemini",
        os.getenv("GEMINI_API_KEY"),
        _parse_models(
            os.getenv("GEMINI_MODEL"),
            "gemini-2.0-flash",
        ),
        os.getenv("GEMINI_BASE_URL", "https://generativelanguage.googleapis.com/v1beta/openai/"),
    )

    add_provider(
        "copilot",
        os.getenv("COPILOT_API_KEY"),
        _parse_models(
            os.getenv("COPILOT_MODEL"),
            "gpt-4o-mini",
        ),
        os.getenv("COPILOT_BASE_URL", "https://models.inference.ai.azure.com"),
    )

    openai_key = os.getenv("OPENAI_API_KEY") or os.getenv("OPENAI_API")
    add_provider(
        "openai",
        openai_key,
        _parse_models(
            os.getenv("OPENAI_ROADMAP_MODEL"),
            "gpt-4o-mini",
        ),
        os.getenv("OPENAI_BASE_URL"),
    )

    openrouter_key = os.getenv("OPENROUTER_API_KEY")
    add_provider(
        "openrouter",
        openrouter_key,
        _parse_models(
            os.getenv("OPENROUTER_ROADMAP_MODEL"),
            "openai/gpt-4o-mini",
        ),
        os.getenv("OPENROUTER_BASE_URL", "https://openrouter.ai/api/v1"),
    )

    groq_key = os.getenv("GROQ_API_KEY")
    add_provider(
        "groq",
        groq_key,
        _parse_models(
            os.getenv("GROQ_ROADMAP_MODEL"),
            "llama-3.3-70b-versatile",
            ["llama-3.1-8b-instant"],
        ),
        os.getenv("GROQ_BASE_URL", "https://api.groq.com/openai/v1"),
    )

    deepseek_key = os.getenv("DEEPSEEK_API_KEY")
    add_provider(
        "deepseek",
        deepseek_key,
        _parse_models(
            os.getenv("DEEPSEEK_ROADMAP_MODEL"),
            "deepseek-chat",
        ),
        os.getenv("DEEPSEEK_BASE_URL", "https://api.deepseek.com"),
    )

    return providers


def _generate_json_with_failover(prompt: str):
    providers = _ai_providers()
    if not providers:
        raise RuntimeError("No AI provider is configured")

    errors = []
    debug_providers = os.getenv("AI_PROVIDER_DEBUG", "false").lower() == "true"

    for provider in providers:
        models = provider.get("models") or []
        for model_name in models:
            try:
                if debug_providers:
                    print(
                        f'AI provider attempt: {provider["name"]} '
                        f'model={model_name} '
                        f'base_url={provider.get("base_url") or "default"}'
                    )
                response = provider["client"].chat.completions.create(
                    model=model_name,
                    messages=[{"role": "user", "content": prompt}],
                    response_format={"type": "json_object"},
                )
                content = response.choices[0].message.content or "{}"
                payload = _extract_json_object(content)
                return payload
            except Exception as error:
                error_message = str(error)
                errors.append({"provider": provider["name"], "model": model_name, "error": error_message})
                if debug_providers:
                    print(f'AI provider failed: {provider["name"]} model={model_name}: {error_message}')
                if _is_retryable_provider_error(error_message):
                    continue
                continue

    raise AIProviderFailure(errors)


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

    if any(keyword in normalized for keyword in ["frontend", "front-end", "ui developer", "web developer"]):
        branches = [
            {
                "title": "Web Foundations",
                "description": "Master the building blocks of frontend interfaces.",
                "items": ["HTML", "CSS", "JavaScript", "Accessibility", "Responsive Design"],
                "children": [
                    {"title": "HTML", "items": ["semantic tags", "forms", "SEO basics"]},
                    {"title": "CSS", "items": ["box model", "flexbox", "grid", "animations"]},
                    {"title": "JavaScript Basics", "items": ["variables", "functions", "DOM", "events"]},
                    {"title": "Responsive UI", "items": ["media queries", "mobile-first layouts"]},
                ],
            },
            {
                "title": "JavaScript Deep Dive",
                "description": "Go beyond basics to modern JS patterns.",
                "items": ["ES6+", "async programming", "TypeScript", "modules"],
                "children": [
                    {"title": "ES6+ Features", "items": ["destructuring", "spread/rest", "classes"]},
                    {"title": "Asynchronous JS", "items": ["promises", "async-await", "fetch"]},
                    {"title": "Types of JS Work", "items": ["vanilla JS", "TypeScript", "framework-based JS"]},
                ],
            },
            {
                "title": "Frontend Frameworks",
                "description": "Build component-driven apps.",
                "items": ["React", "routing", "state management", "UI libraries"],
                "children": [
                    {"title": "React Core", "items": ["components", "props", "state", "hooks"]},
                    {"title": "Routing", "items": ["React Router", "nested routes", "params"]},
                    {"title": "State Management", "items": ["context", "Redux toolkit", "query caching"]},
                ],
            },
            {
                "title": "Testing & Delivery",
                "description": "Ship reliable frontend features.",
                "items": ["unit tests", "integration tests", "build tools", "deployment"],
                "children": [
                    {"title": "Testing", "items": ["Jest/Vitest", "React Testing Library"]},
                    {"title": "Tooling", "items": ["Vite/Webpack", "linting", "formatting"]},
                    {"title": "Deployment", "items": ["build optimization", "hosting", "monitoring"]},
                ],
            },
        ]
    elif any(keyword in normalized for keyword in ["backend", "back-end", "api developer", "server-side"]):
        branches = [
            {
                "title": "Programming & Runtime",
                "description": "Choose and master your backend language and runtime.",
                "items": ["Node.js/Python/Java", "data structures", "error handling", "OOP"],
                "children": [
                    {"title": "Core Language", "items": ["syntax", "modules", "debugging"]},
                    {"title": "Runtime Concepts", "items": ["event loop/threads", "memory", "performance"]},
                ],
            },
            {
                "title": "API Engineering",
                "description": "Design and build robust APIs.",
                "items": ["REST", "GraphQL", "authentication", "validation", "documentation"],
                "children": [
                    {"title": "REST APIs", "items": ["CRUD", "status codes", "pagination"]},
                    {"title": "Security", "items": ["JWT", "OAuth", "rate limiting", "input validation"]},
                    {"title": "API Docs", "items": ["OpenAPI/Swagger", "versioning"]},
                ],
            },
            {
                "title": "Databases & Caching",
                "description": "Persist and optimize data workflows.",
                "items": ["SQL", "NoSQL", "ORM", "indexing", "Redis"],
                "children": [
                    {"title": "SQL", "items": ["schema design", "joins", "transactions"]},
                    {"title": "NoSQL", "items": ["document modeling", "aggregation"]},
                    {"title": "Caching", "items": ["Redis", "cache invalidation"]},
                ],
            },
            {
                "title": "DevOps & Scalability",
                "description": "Prepare backend systems for production.",
                "items": ["Docker", "CI/CD", "logging", "monitoring", "cloud basics"],
                "children": [
                    {"title": "Deployment", "items": ["containers", "cloud hosting", "release strategies"]},
                    {"title": "Observability", "items": ["logs", "metrics", "alerts", "tracing"]},
                    {"title": "Scalability", "items": ["load balancing", "queues", "horizontal scaling"]},
                ],
            },
        ]
    elif any(keyword in normalized for keyword in ["full stack", "full-stack", "fullstack", "mern"]):
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
- If the input is a job role/specialization, return a required-skills graph (fundamentals, core technologies, frameworks/tools, testing, projects).
- Prefer concrete skill names over abstract labels (example: HTML, CSS, JavaScript, TypeScript, React, APIs, SQL).
- For Full Stack, always include Frontend, Backend, Database, and Deployment branches.
- For Full Stack frontend, include HTML, CSS, JavaScript, and React as child topics.
- Use concise labels that look good in a flowchart.
"""


def _generate_tree_with_ai(skill: str, level: str | None):
    payload = _generate_json_with_failover(_prompt_for_tree(skill, level))
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


def _prompt_for_role_specializations(role: str) -> str:
    readable_role = _humanize_skill(role)
    return f"""
You are generating job specializations for a career selection page.

Role: {readable_role}

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


def _generate_role_specializations_with_ai(role: str):
    payload = _generate_json_with_failover(_prompt_for_role_specializations(role))
    if "items" not in payload:
        raise ValueError("AI role specialization payload missing items")
    return payload


def generate_role_specializations(role: str):
    if not isinstance(role, str) or not role.strip():
        return {
            "error": "Role is required",
            "role": "",
            "summary": "",
            "items": [],
        }

    role_title = _humanize_skill(role)
    try:
        payload = _generate_role_specializations_with_ai(role)
    except AIProviderFailure as error:
        if error.errors and all(_is_quota_error(item.get("error", "")) for item in error.errors):
            return {
                "error": "AI quota exceeded on all configured providers. Please update billing/quota and try again.",
                "error_code": "insufficient_quota",
                "role": role_title,
                "summary": "",
                "items": [],
                "provider_errors": error.errors,
            }
        return {
            "error": "AI specialization generation failed across all configured providers.",
            "error_code": "ai_generation_failed",
            "role": role_title,
            "summary": "",
            "items": [],
            "provider_errors": error.errors,
        }
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
        return {
            "error": f"AI specialization generation failed: {error_message}",
            "error_code": "ai_generation_failed",
            "role": role_title,
            "summary": "",
            "items": [],
        }
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
        cleaned_items.append(
            {
                "title": title,
                "description": description,
            }
        )

    if not cleaned_items:
        return {
            "error": "AI returned no specialization items for this role",
            "role": role_title,
            "summary": payload.get("summary", "") if isinstance(payload, dict) else "",
            "items": [],
        }

    return {
        "role": role_title,
        "summary": payload.get("summary", ""),
        "items": cleaned_items,
    }
