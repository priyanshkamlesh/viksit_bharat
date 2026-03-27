def build_flowchart(steps):
    nodes = []
    edges = []

    for step in steps:
        nodes.append({
            "id": step["id"],
            "data": {"label": step["title"]},
            "position": {"x": 0, "y": 0}
        })

        for dep in step.get("depends_on", []):
            edges.append({
                "source": dep,
                "target": step["id"]
            })

    return {
        "nodes": nodes,
        "edges": edges
    }