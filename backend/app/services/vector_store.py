from __future__ import annotations

from functools import lru_cache
from typing import Any

from app.core.config import get_settings


def pinecone_configured() -> bool:
    """True when a real-looking Pinecone key and index name are configured."""
    settings = get_settings()
    key = (settings.pinecone_api_key or "").strip()
    return bool(key) and not key.lower().startswith("your-") and bool(settings.pinecone_index_name)


@lru_cache(maxsize=1)
def _get_pinecone_index() -> Any:
    """Initialize and cache the Pinecone index client."""
    if not pinecone_configured():
        raise RuntimeError("Pinecone is not configured")
    settings = get_settings()
    try:
        from pinecone import Pinecone
    except ImportError as exc:  # pragma: no cover
        raise RuntimeError("pinecone package is not installed") from exc

    try:
        client = Pinecone(api_key=settings.pinecone_api_key)
        return client.Index(settings.pinecone_index_name or "unify-opportunities")
    except Exception as exc:
        raise RuntimeError(f"Pinecone is unavailable: {exc}") from exc


def query_similar_opportunities(
    vector: list[float],
    top_k: int = 10,
    filter_dict: dict[str, Any] | None = None,
) -> list[dict[str, Any]]:
    """Query Pinecone for opportunities similar to the given vector."""
    if not vector:
        raise ValueError("vector cannot be empty")
    if top_k < 1:
        raise ValueError("top_k must be greater than 0")

    index = _get_pinecone_index()
    try:
        result = index.query(
            vector=vector,
            top_k=top_k,
            filter=filter_dict,
            include_metadata=True,
            include_values=False,
        )
    except Exception as exc:  # pragma: no cover
        raise RuntimeError("failed to query Pinecone opportunities index") from exc

    matches = getattr(result, "matches", None)
    if matches is None and isinstance(result, dict):
        matches = result.get("matches", [])

    normalized: list[dict[str, Any]] = []
    for match in matches or []:
        if isinstance(match, dict):
            normalized.append(match)
            continue

        normalized.append(
            {
                "id": getattr(match, "id", None),
                "score": getattr(match, "score", None),
                "metadata": getattr(match, "metadata", None),
            }
        )

    return normalized


def upsert_opportunity_vector(vector_id: str, vector: list[float], metadata: dict[str, Any]) -> None:
    """Upsert an opportunity vector into Pinecone."""
    if not vector_id:
        raise ValueError("vector_id cannot be empty")
    if not vector:
        raise ValueError("vector cannot be empty")

    index = _get_pinecone_index()
    try:
        index.upsert(
            vectors=[
                {
                    "id": vector_id,
                    "values": vector,
                    "metadata": metadata,
                }
            ]
        )
    except Exception as exc:  # pragma: no cover
        raise RuntimeError("failed to upsert opportunity vector") from exc
