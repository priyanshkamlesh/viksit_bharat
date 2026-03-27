from backend.controllers.recommendation_controller import load_users
from backend.models.ai_graph_model import build_flowchart


def get_technology_graph(user_id, selected_skills):
    users = load_users()
    user = next((candidate for candidate in users if candidate["id"] == user_id), None)

    if not user:
        return {"error": "User not found"}

    if not selected_skills:
        return {"error": "Please provide at least one selected skill"}

    return build_flowchart(user, selected_skills)
