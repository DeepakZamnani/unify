# System Architecture Specification

## 1. High-Level Topology
- **Frontend**: React + Vite, TypeScript, Tailwind CSS, Shadcn UI, Lucide Icons.
- **Backend API Gateway**: FastAPI Python REST Layer handling request routing, JWT Auth, and RBAC.
- **AI Microservice**: FastAPI Python engine housing Sentence-BERT models, CrewAI agents, and Pinecone vector connectors.
- **Relational Storage**: PostgreSQL (users, profiles, opportunities, contracts, audit logs).
- **Vector Storage**: Pinecone (768-dim dense index with metadata filtering by sector, budget, location).
- **Cache & Message Broker**: Redis (rate limiting, webhooks, task queues).

## 2. Data Flow Sequence
1. **Ingestion**: Scrapers / Webhooks fetch raw tenders -> Cleaned & Parsed by CrewAI Ingestion Agent.
2. **Vectorization**: Sentence-BERT generates 768-dim vector embeddings for opportunities & MSME capabilities.
3. **Retrieval**: User queries trigger hybrid vector + metadata filter search against Pinecone.
4. **Rebalancing**: VRA layer recalculates top-k rankings based on historical exposure weights before returning payload to React UI.