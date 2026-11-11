"""COMS (Capability-Opportunity Matching Score) over Firestore data.

* company capabilities come from ``profile/main``
* candidate opportunities come from the ``opportunities`` collection
* score = 0.7 * semantic similarity (sentence embeddings, cosine) + 0.3 * capability overlap
"""
from __future__ import annotations

import math
from typing import Any

from app.services import firestore

PROFILE_DOC = "profile/main"
VECTOR_WEIGHT = 0.7
OVERLAP_WEIGHT = 0.3

_STOPWORDS = frozenset({"and", "or", "the", "for", "with", "of", "in", "to", "a", "an", "on", "at", "by", "&", "is", "are"})
_EMBED_CACHE: dict[str, tuple[int, list[float]]] = {}


def _tokenize(text: str) -> set[str]:
    cleaned = text.lower()
    for ch in "/-,.;:()[]":
        cleaned = cleaned.replace(ch, " ")
    return {t for t in cleaned.split() if len(t) > 1 and t not in _STOPWORDS}


def _flatten(value: Any) -> list[str]:
    if isinstance(value, str):
        return [value.strip()] if value.strip() else []
    if isinstance(value, dict):
        return [s for v in value.values() for s in _flatten(v)]
    if isinstance(value, (list, tuple)):
        return [s for v in value for s in _flatten(v)]
    return []


def profile_text(profile: dict[str, Any]) -> str:
    """All capability-bearing text of the company profile."""
    parts = [
        *_flatten(profile.get("capabilities")),
        *_flatten(profile.get("certifications")),
        *_flatten(profile.get("industry")),
        *_flatten(profile.get("bio")),
        *(_flatten(p.get("name")) for p in profile.get("pastProjects") or [] if isinstance(p, dict)),
    ]
    flat: list[str] = []
    for part in parts:
        flat.extend(part if isinstance(part, list) else [part])
    return " ".join(flat) or str(profile.get("companyName", ""))


def opportunity_text(opp: dict[str, Any]) -> str:
    return " ".join(
        str(opp.get(k, "")) for k in ("title", "description", "sector", "postedBy", "location") if opp.get(k)
    )


def _embed(key: str, text: str) -> list[float] | None:
    cached = _EMBED_CACHE.get(key)
    if cached and cached[0] == hash(text):
        return cached[1]
    try:
        from app.services.embedding import generate_embedding

        vec = generate_embedding(text)
    except Exception:
        return None
    _EMBED_CACHE[key] = (hash(text), vec)
    return vec


def _cosine(a: list[float], b: list[float]) -> float:
    if len(a) != len(b):
        return 0.0
    norm = math.sqrt(sum(x * x for x in a)) * math.sqrt(sum(y * y for y in b))
    return sum(x * y for x, y in zip(a, b)) / norm if norm else 0.0


def similarity_score(profile_vec: list[float] | None, opp_vec: list[float] | None) -> float:
    """Cosine similarity mapped to 0..1 (0 when embeddings are unavailable)."""
    if not profile_vec or not opp_vec:
        return 0.0
    return max(0.0, min(1.0, (_cosine(profile_vec, opp_vec) + 1.0) / 2.0))


def capability_overlap(profile: dict[str, Any], opp: dict[str, Any]) -> tuple[float, list[str]]:
    """Share of the opportunity's vocabulary covered by the company's capabilities."""
    profile_tokens = _tokenize(profile_text(profile))
    opp_tokens = _tokenize(opportunity_text(opp))
    if not profile_tokens or not opp_tokens:
        return 0.0, []
    shared = profile_tokens & opp_tokens
    return min(1.0, len(shared) / len(opp_tokens)), [f"capability:{t}" for t in sorted(shared)[:5]]


def score_opportunity(
    profile: dict[str, Any], profile_vec: list[float] | None, opp: dict[str, Any]
) -> dict[str, Any]:
    opp_vec = _embed(f"opp:{opp['id']}", opportunity_text(opp)) if profile_vec else None
    vector_score = similarity_score(profile_vec, opp_vec)
    overlap, tags = capability_overlap(profile, opp)
    coms = VECTOR_WEIGHT * vector_score + OVERLAP_WEIGHT * overlap
    return {
        "opportunity_id": str(opp["id"]),
        "title": str(opp.get("title", "")),
        "organization": str(opp.get("postedBy", "")),
        "sector": str(opp.get("sector", "")),
        "opportunity_type": str(opp.get("type", "")),
        "vector_similarity": round(vector_score, 4),
        "capability_overlap": round(overlap, 4),
        "coms_score": round(coms, 4),
        "explainability_tags": [f"vector_similarity:{round(vector_score, 3)}", *tags],
    }


def load_profile(id_token: str | None) -> dict[str, Any] | None:
    return firestore.get_doc(PROFILE_DOC, id_token)


def embed_profile(profile: dict[str, Any]) -> list[float] | None:
    return _embed("profile:main", profile_text(profile))


def _verified_titles(id_token: str | None) -> set[str]:
    """Titles that the admin-curated tender/contract collections mark as verified."""
    titles: set[str] = set()
    for collection in ("governmentTenders", "governmentContracts"):
        try:
            titles |= {str(d.get("title", "")).lower() for d in firestore.list_docs(collection, id_token) if d.get("verified")}
        except firestore.FirestoreError:
            continue
    return titles


def get_coms_matches(
    id_token: str | None,
    top_k: int = 5,
    sectors: list[str] | None = None,
    is_verified: bool | None = None,
) -> list[dict[str, Any]]:
    """Rank Firestore opportunities for the company profile. Raises LookupError without a profile."""
    profile = load_profile(id_token)
    if profile is None:
        raise LookupError("Company profile not found")

    opportunities = firestore.list_docs("opportunities", id_token)
    if sectors:
        wanted = [s.strip().lower() for s in sectors]
        opportunities = [o for o in opportunities if any(w in str(o.get("sector", "")).lower() for w in wanted)]
    if is_verified is not None:
        verified = _verified_titles(id_token)
        opportunities = [
            o for o in opportunities
            if (bool(o.get("verified")) or str(o.get("title", "")).lower() in verified) == is_verified
        ]

    profile_vec = embed_profile(profile)
    scored = [score_opportunity(profile, profile_vec, o) for o in opportunities]
    scored.sort(key=lambda m: m["coms_score"], reverse=True)
    return scored[:top_k]
