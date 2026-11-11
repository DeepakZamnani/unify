from __future__ import annotations

from functools import lru_cache
import os


EMBEDDING_DIMENSION = 768
EMBEDDING_MODEL_NAME = "sentence-transformers/all-mpnet-base-v2"
OPENAI_EMBEDDING_MODEL = os.getenv("OPENAI_EMBEDDING_MODEL", "text-embedding-3-small")


@lru_cache(maxsize=1)
def _get_sentence_transformer_model() -> object:
    try:
        from sentence_transformers import SentenceTransformer
    except ImportError as exc:  # pragma: no cover
        raise RuntimeError("sentence-transformers package is not installed") from exc

    return SentenceTransformer(EMBEDDING_MODEL_NAME)


def _generate_sentence_transformer_embedding(text: str) -> list[float]:
    model = _get_sentence_transformer_model()
    embedding = model.encode([text], normalize_embeddings=True)
    vector = embedding[0].tolist() if hasattr(embedding[0], "tolist") else list(embedding[0])
    return [float(value) for value in vector]


def _generate_openai_embedding(text: str) -> list[float]:
    try:
        from openai import OpenAI
    except ImportError as exc:  # pragma: no cover
        raise RuntimeError("openai package is not installed") from exc

    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        raise RuntimeError("OPENAI_API_KEY is required for OpenAI embeddings")

    client = OpenAI(api_key=api_key)
    response = client.embeddings.create(
        model=OPENAI_EMBEDDING_MODEL,
        input=text,
        dimensions=EMBEDDING_DIMENSION,
    )
    embedding = response.data[0].embedding
    return [float(value) for value in embedding[:EMBEDDING_DIMENSION]]


def generate_embedding(text: str) -> list[float]:
    """Generate a 768-dimensional embedding for the given text."""
    cleaned_text = text.strip()
    if not cleaned_text:
        raise ValueError("text cannot be empty")

    try:
        return _generate_sentence_transformer_embedding(cleaned_text)
    except Exception:
        return _generate_openai_embedding(cleaned_text)
