from functools import lru_cache

from backend.models.ai_roadmap_model import generate_roadmap


@lru_cache(maxsize=128)
def _generate_full_output_cached(skill, level):
    return generate_roadmap(skill, level)


def generate_full_output(skill, level=None):
    return _generate_full_output_cached(skill, level)
