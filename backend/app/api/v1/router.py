from __future__ import annotations

from fastapi import APIRouter

from app.api.v1.endpoints.chat import router as chat_router
from app.api.v1.endpoints.matching import router as matching_router
from app.api.v1.endpoints.profiles import router as profiles_router

# Auth, profiles, opportunities and applications live in Firebase/Firestore (Express API + client SDK).
# This service only hosts the AI features: COMS matching and the chatbot.
api_router = APIRouter()
api_router.include_router(profiles_router, prefix="/profiles")
api_router.include_router(matching_router)
api_router.include_router(chat_router, prefix="/chat")
