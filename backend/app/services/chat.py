from __future__ import annotations

import json
from datetime import date
from typing import Any, Generator

from app.core.firebase_auth import FirebaseUser
from app.services import firestore
from app.services.matching import (
    embed_profile,
    load_profile,
    score_opportunity,
)

# ---------------------------------------------------------------------------
# Tool schemas exposed to the LLM
# ---------------------------------------------------------------------------

_CATEGORIES = {
    "opportunities": ("opportunities", "postedBy"),
    "tenders": ("governmentTenders", "department"),
    "contracts": ("governmentContracts", "department"),
    "supply_chain": ("supplyChainRequests", "companyName"),
    "collaborations": ("collaborations", "companyName"),
}

CHAT_TOOLS: list[dict[str, Any]] = [
    {
        "type": "function",
        "function": {
            "name": "search_opportunities",
            "description": (
                "Search the UNIFY database for procurement opportunities: general opportunities, government "
                "tenders, government contracts, private supply-chain requests and collaboration projects. "
                "Use it whenever the user asks to find or list anything open on the platform."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "query": {"type": "string", "description": "Free-text keywords, e.g. 'solar' or 'road safety'. Empty for all."},
                    "category": {
                        "type": "string",
                        "enum": ["all", *_CATEGORIES],
                        "description": "Which listing to search. Default 'all'.",
                    },
                    "sector": {"type": "string", "description": "Optional sector filter (e.g. 'Energy', 'Healthcare')."},
                    "limit": {"type": "integer", "description": "Max results (1-10). Default 5."},
                },
                "required": [],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "explain_match",
            "description": (
                "Explain how well the user's company matches one opportunity: COMS score, semantic similarity "
                "and matching capabilities. Use for 'why is this a good match?' or 'how well do I fit X?'."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "opportunity": {"type": "string", "description": "Opportunity id or (part of) its title."},
                },
                "required": ["opportunity"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_my_applications",
            "description": "List the signed-in user's applications and their status (pending, accepted, rejected, withdrawn).",
            "parameters": {
                "type": "object",
                "properties": {"status": {"type": "string", "description": "Optional status filter."}},
                "required": [],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_company_profile",
            "description": "Get the company profile: industry, location, capabilities, certifications and past projects.",
            "parameters": {"type": "object", "properties": {}, "required": []},
        },
    },
    {
        "type": "function",
        "function": {
            "name": "platform_help",
            "description": (
                "Answer how-to / FAQ questions about UNIFY: COMS matching, fairness (VRA), subscriptions, "
                "how to apply, mediation, digital maturity."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "topic": {
                        "type": "string",
                        "description": "One of: coms_matching, vra_fairness, subscriptions, how_to_apply, mediation, digital_maturity, general.",
                    },
                },
                "required": ["topic"],
            },
        },
    },
]


# ---------------------------------------------------------------------------
# Tool executors (all data comes from Firestore)
# ---------------------------------------------------------------------------

def _summarise(category: str, doc: dict[str, Any]) -> dict[str, Any]:
    _, owner_field = _CATEGORIES[category]
    return {
        "id": doc["id"],
        "category": category,
        "title": doc.get("title") or doc.get("projectTitle"),
        "organization": doc.get(owner_field),
        "sector": doc.get("sector"),
        "location": doc.get("location"),
        "budget": doc.get("budgetRange") or doc.get("budget"),
        "deadline": doc.get("deadline") or None,
        "type": doc.get("type"),
        "verified": doc.get("verified"),
        "status": doc.get("status"),
        "description": (doc.get("description") or "")[:200],
    }


def _exec_search_opportunities(user: FirebaseUser, args: dict[str, Any]) -> dict[str, Any]:
    query = str(args.get("query") or "").lower().split()
    sector = str(args.get("sector") or "").lower()
    category = str(args.get("category") or "all")
    try:
        limit = max(1, min(int(args.get("limit") or 5), 10))
    except (TypeError, ValueError):
        limit = 5
    categories = list(_CATEGORIES) if category == "all" or category not in _CATEGORIES else [category]

    results: list[dict[str, Any]] = []
    for cat in categories:
        for doc in firestore.list_docs(_CATEGORIES[cat][0], user.id_token):
            haystack = " ".join(str(doc.get(k, "")) for k in ("title", "projectTitle", "description", "sector", "location", "postedBy", "department", "companyName", "requiredSkills")).lower()
            if sector and sector not in str(doc.get("sector", "")).lower():
                continue
            if query and not all(word in haystack for word in query):
                continue
            results.append(_summarise(cat, doc))
    results.sort(key=lambda r: (r["deadline"] is None, r["deadline"] or ""))
    return {"found": len(results), "showing": min(limit, len(results)), "results": results[:limit]}


def _exec_explain_match(user: FirebaseUser, args: dict[str, Any]) -> dict[str, Any]:
    needle = str(args.get("opportunity") or "").strip().lower()
    profile = load_profile(user.id_token)
    if profile is None:
        return {"error": "No company profile found. Complete the Profile page to see match scores."}
    opportunities = firestore.list_docs("opportunities", user.id_token)
    opp = next((o for o in opportunities if str(o["id"]).lower() == needle), None) or next(
        (o for o in opportunities if needle and needle in str(o.get("title", "")).lower()), None
    )
    if opp is None:
        return {"error": f"No opportunity matching '{args.get('opportunity')}' was found."}

    m = score_opportunity(profile, embed_profile(profile), opp)
    tags = [t.removeprefix("capability:") for t in m["explainability_tags"] if t.startswith("capability:")]
    return {
        **m,
        "your_company": profile.get("companyName"),
        "matched_capabilities": tags,
        "explanation": (
            f"COMS {m['coms_score']:.0%} = 70% semantic similarity ({m['vector_similarity']:.0%}) "
            f"+ 30% capability overlap ({m['capability_overlap']:.0%}). "
            + (f"Shared keywords: {', '.join(tags)}." if tags else "No direct keyword overlap.")
        ),
    }


def _exec_get_my_applications(user: FirebaseUser, args: dict[str, Any]) -> dict[str, Any]:
    wanted = str(args.get("status") or "").lower()
    apps = [
        a for a in firestore.list_docs("applications", user.id_token)
        if user.uid in (a.get("createdBy"), a.get("applicantId")) and (not wanted or str(a.get("status", "")).lower() == wanted)
    ]
    apps.sort(key=lambda a: str(a.get("createdAt", "")), reverse=True)
    return {
        "count": len(apps),
        "applications": [
            {
                "id": a["id"],
                "opportunity": a.get("opportunityTitle"),
                "organization": a.get("company"),
                "status": a.get("status"),
                "applied_date": a.get("appliedDate"),
                "budget": a.get("budget"),
            }
            for a in apps[:15]
        ],
    }


def _exec_get_company_profile(user: FirebaseUser) -> dict[str, Any]:
    p = load_profile(user.id_token)
    if p is None:
        return {"error": "No company profile found."}
    return {
        "company": p.get("companyName"),
        "industry": p.get("industry"),
        "location": p.get("location"),
        "employees": p.get("employees"),
        "capabilities": p.get("capabilities"),
        "certifications": p.get("certifications"),
        "bio": p.get("bio"),
        "past_projects": p.get("pastProjects"),
    }


_HELP_CONTENT: dict[str, str] = {
    "coms_matching": (
        "**COMS (Capability-Opportunity Matching Score)** ranks opportunities for your company profile:\n"
        "- 70% semantic similarity: sentence embeddings of your profile (capabilities, certifications, bio, past projects) "
        "vs. each opportunity's text.\n"
        "- 30% capability overlap: how much of the opportunity's vocabulary your profile covers.\n"
        "Scores run 0-100%; open **COMS Matching** in the sidebar to run it."
    ),
    "vra_fairness": (
        "**VRA (Visibility Rebalancing Algorithm)** is UNIFY's fairness layer: VRA_Score = 0.75 x COMS + 0.25 x Discovery_Weight, "
        "boosting MSMEs that have had little recent exposure so large players don't monopolise opportunities. "
        "(Planned - not live yet.)"
    ),
    "subscriptions": (
        "Plans (see **Subscriptions**): Basic Rs 999/mo, Intermediate Rs 2,999/mo (popular), Expert Rs 7,999/mo with unlimited views."
    ),
    "how_to_apply": (
        "Open **Opportunities**, pick one, and press **Apply**. Track it under **My Applications**; "
        "owners review incoming ones under **Requests**."
    ),
    "mediation": "**Mediation** helps resolve disputes on active deals: see the **Mediation** page for deal status and steps.",
    "digital_maturity": "Digital maturity reflects how complete your profile is: capabilities, certifications, past projects and bio.",
    "general": (
        "**UNIFY** is an AI-powered B2B procurement platform for MSMEs: opportunities, government tenders & contracts, "
        "supply chain, collaborations, COMS matching and this assistant."
    ),
}


def _exec_platform_help(args: dict[str, Any]) -> dict[str, Any]:
    topic = str(args.get("topic", "general")).lower()
    return {"topic": topic, "content": _HELP_CONTENT.get(topic, _HELP_CONTENT["general"])}


def build_system_prompt(user: FirebaseUser) -> str:
    who = "a UNIFY platform administrator" if user.is_admin else "a business user"
    return (
        "You are UNIFY Assistant, an AI assistant embedded in the UNIFY B2B procurement platform. "
        f"You are talking to {who} ({user.email}). "
        "You help with opportunities, government tenders and contracts, supply-chain requests, collaborations, "
        "match scores and the user's applications. "
        "ALWAYS use the tools to fetch real data from the UNIFY database; never invent opportunities, numbers or statuses. "
        "Be concise and professional and use markdown for lists and tables. "
        f"Today is {date.today().isoformat()}; when listing items, clearly flag any whose deadline has already passed as expired. "
        "If the data does not contain the answer, say so."
    )


GROQ_BASE_URL = "https://api.groq.com/openai/v1"
MAX_TOOL_ROUNDS = 3
MAX_HISTORY_MESSAGES = 20


def _sse(payload: dict[str, Any]) -> str:
    return f"data: {json.dumps(payload, default=str)}\n\n"


def _text_event(text: str) -> str:
    return _sse({"delta": text, "done": False, "type": "text"})


def _run_tool(user: FirebaseUser, name: str, args: dict[str, Any]) -> dict[str, Any]:
    try:
        if name == "search_opportunities":
            return _exec_search_opportunities(user, args)
        if name == "explain_match":
            return _exec_explain_match(user, args)
        if name == "get_my_applications":
            return _exec_get_my_applications(user, args)
        if name == "get_company_profile":
            return _exec_get_company_profile(user)
        if name == "platform_help":
            return _exec_platform_help(args)
        return {"error": f"Unknown tool: {name}"}
    except firestore.FirestoreError as exc:
        return {"error": f"Database error: {exc}"}
    except Exception as exc:
        return {"error": f"Tool execution failed: {exc}"}


def _friendly_error(exc: Exception) -> str:
    text = str(exc)
    status = getattr(exc, "status_code", None)
    if status == 401 or "invalid_api_key" in text:
        return "The Groq API key is invalid. Please check GROQ_API_KEY in backend/.env."
    if status == 429:
        return "The AI service is rate-limited right now. Please try again in a moment."
    if status == 404 or "model_not_found" in text:
        return "The configured Groq model was not found. Please check GROQ_MODEL in backend/.env."
    return f"Error connecting to AI service: {text}"


def stream_chat_response(
    current_user: FirebaseUser,
    messages: list[dict[str, Any]],
) -> Generator[str, None, None]:
    """Stream a Groq chat completion (with tool use) as SSE events.

    Each yield is a complete ``data: <json>\\n\\n`` line, ending with ``data: [DONE]``.
    """
    from app.core.config import get_settings
    from openai import OpenAI

    settings = get_settings()
    if not settings.groq_api_key:
        yield _text_event("Groq API key is not configured. Please add GROQ_API_KEY to your .env file.")
        yield "data: [DONE]\n\n"
        return

    client = OpenAI(api_key=settings.groq_api_key, base_url=GROQ_BASE_URL, max_retries=2, timeout=60.0)
    model = settings.groq_model

    conversation: list[dict[str, Any]] = [
        {"role": "system", "content": build_system_prompt(current_user)},
        *messages[-MAX_HISTORY_MESSAGES:],
    ]

    use_tools = True
    round_no = 0
    while True:
        round_no += 1
        offer_tools = use_tools and round_no <= MAX_TOOL_ROUNDS
        kwargs: dict[str, Any] = {"model": model, "messages": conversation, "stream": True, "temperature": 0.3}
        if offer_tools:
            kwargs["tools"] = CHAT_TOOLS
            kwargs["tool_choice"] = "auto"

        content = ""
        tool_calls_acc: dict[int, dict[str, Any]] = {}
        try:
            stream = client.chat.completions.create(**kwargs)
            for chunk in stream:
                choice = chunk.choices[0] if chunk.choices else None
                if choice is None:
                    continue
                delta = choice.delta
                if delta.content:
                    content += delta.content
                    yield _text_event(delta.content)
                for tc in delta.tool_calls or []:
                    slot = tool_calls_acc.setdefault(
                        tc.index, {"id": "", "type": "function", "function": {"name": "", "arguments": ""}}
                    )
                    if tc.id:
                        slot["id"] = tc.id
                    if tc.function:
                        if tc.function.name:
                            slot["function"]["name"] += tc.function.name
                        if tc.function.arguments:
                            slot["function"]["arguments"] += tc.function.arguments
        except Exception as exc:
            # Models occasionally emit malformed tool calls (Groq 400
            # "tool_use_failed"). Retry once without tools so the user still gets an answer.
            if offer_tools and not content and getattr(exc, "status_code", None) == 400:
                use_tools = False
                continue
            yield _text_event(_friendly_error(exc))
            break

        calls = [tc for _, tc in sorted(tool_calls_acc.items()) if tc["function"]["name"]]
        if not calls:
            break

        for n, tc in enumerate(calls):
            tc["id"] = tc["id"] or f"call_{round_no}_{n}"

        yield _sse({"delta": "", "done": False, "type": "tool_start", "tools": [tc["function"]["name"] for tc in calls]})
        conversation.append({"role": "assistant", "content": content or None, "tool_calls": calls})

        for tc in calls:
            name = tc["function"]["name"]
            try:
                args = json.loads(tc["function"]["arguments"] or "{}")
                if not isinstance(args, dict):
                    args = {}
            except json.JSONDecodeError:
                args = {}
            result = _run_tool(current_user, name, args)
            yield _sse({"delta": "", "done": False, "type": "tool_result", "tool_name": name, "result": result})
            conversation.append({"role": "tool", "tool_call_id": tc["id"], "content": json.dumps(result, default=str)})

    yield "data: [DONE]\n\n"
