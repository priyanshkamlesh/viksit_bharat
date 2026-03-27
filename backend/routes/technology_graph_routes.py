from fastapi import APIRouter

from backend.controllers.technology_graph_controller import get_technology_graph
from backend.models.mock_interview_schema import TechnologyGraphRequest


router = APIRouter(prefix="/technology", tags=["technology"])


@router.post("/graph")
def build_technology_graph(payload: TechnologyGraphRequest):
    return get_technology_graph(payload.user_id, payload.selected_skills)
