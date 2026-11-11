"""Firestore access over the public REST API.

Mirrors ``unify/backend/src/lib/firestoreRest.js``: calls are authenticated as the
signed-in user (their Firebase ID token), so ``firestore.rules`` stays the real
access-control boundary. Without a token the web API key is used (public reads only).
"""
from __future__ import annotations

from typing import Any

import httpx

from app.core.config import get_settings


class FirestoreError(RuntimeError):
    def __init__(self, status: int, message: str) -> None:
        super().__init__(message)
        self.status = status


def _base() -> str:
    return f"https://firestore.googleapis.com/v1/projects/{get_settings().firebase_project_id}/databases/(default)/documents"


def _auth(id_token: str | None) -> tuple[dict[str, str], dict[str, str]]:
    if id_token:
        return {"Authorization": f"Bearer {id_token}"}, {}
    return {}, {"key": get_settings().firebase_api_key}


def _decode_value(v: dict[str, Any]) -> Any:
    if "stringValue" in v:
        return v["stringValue"]
    if "booleanValue" in v:
        return v["booleanValue"]
    if "integerValue" in v:
        return int(v["integerValue"])
    if "doubleValue" in v:
        return float(v["doubleValue"])
    if "timestampValue" in v:
        return v["timestampValue"]
    if "arrayValue" in v:
        return [_decode_value(i) for i in v["arrayValue"].get("values", [])]
    if "mapValue" in v:
        return _decode_fields(v["mapValue"].get("fields", {}))
    return None


def _decode_fields(fields: dict[str, Any]) -> dict[str, Any]:
    return {k: _decode_value(v) for k, v in fields.items()}


def _decode_doc(doc: dict[str, Any]) -> dict[str, Any]:
    return {"id": doc["name"].rsplit("/", 1)[-1], **_decode_fields(doc.get("fields", {}))}


def _request(method: str, url: str, id_token: str | None, **kwargs: Any) -> Any:
    headers, params = _auth(id_token)
    try:
        resp = httpx.request(method, url, headers=headers, params={**params, **kwargs.pop("params", {})}, timeout=20.0, **kwargs)
    except httpx.HTTPError as exc:
        raise FirestoreError(503, f"Firestore unreachable: {exc}") from exc
    if resp.status_code >= 400:
        try:
            message = resp.json()["error"]["message"]
        except Exception:
            message = f"Firestore request failed ({resp.status_code})"
        raise FirestoreError(resp.status_code, message)
    return resp.json()


def get_doc(path: str, id_token: str | None = None) -> dict[str, Any] | None:
    try:
        return _decode_doc(_request("GET", f"{_base()}/{path}", id_token))
    except FirestoreError as exc:
        if exc.status == 404:
            return None
        raise


def list_docs(collection: str, id_token: str | None = None, limit: int = 500) -> list[dict[str, Any]]:
    """List every document of a top-level collection (paginated)."""
    docs: list[dict[str, Any]] = []
    page_token: str | None = None
    while len(docs) < limit:
        params: dict[str, str] = {"pageSize": str(min(300, limit - len(docs)))}
        if page_token:
            params["pageToken"] = page_token
        data = _request("GET", f"{_base()}/{collection}", id_token, params=params)
        docs.extend(_decode_doc(d) for d in data.get("documents", []))
        page_token = data.get("nextPageToken")
        if not page_token:
            break
    return docs
