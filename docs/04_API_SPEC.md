# REST & OpenAPI Specifications

## Key Endpoints

### 1. Match & Search
- `POST /api/v1/opportunities/recommendations`
  - **Headers**: `Authorization: Bearer <JWT>`
  - **Payload**: `{ "msme_id": "UUID", "sector_filter": ["IT & Infrastructure"], "top_k": 10 }`
  - **Response**: List of matched opportunities with `coms_score`, `vra_score`, and `explainability_tags`.

### 2. Ingestion Trigger
- `POST /api/v1/agents/ingest-tender`
  - **Payload**: `{ "raw_text": "string", "source_url": "string" }`
  - **Response**: `{ "opportunity_id": "UUID", "status": "INGESTED_AND_VECTORIZED" }`

### 3. Mediation & Escalation
- `POST /api/v1/mediation/escalate`
  - **Payload**: `{ "contract_id": "UUID", "reason": "string", "chat_log_ids": ["UUID"] }`
  - **Response**: `{ "ticket_id": "UUID", "status": "ESCALATED_TO_AI_MEDIATOR" }`