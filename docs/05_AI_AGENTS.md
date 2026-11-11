# CrewAI Multi-Agent Execution Topology

1. **Scraping & Parsing Agent**: Structuring messy procurement HTML/PDF documents into normalized JSON.
2. **COMS Embedding Agent**: Interfacing with `SentenceTransformer('all-mpnet-base-v2')` to output 768-dim dense vectors.
3. **VRA Fairness Agent**: Fetching historical exposure statistics from Redis and adjusting rank scores dynamically (α=0.75, β=0.25).
4. **Mediation Support Agent**: Ingesting contract milestone history and chat logs to summarize dispute tickets for platform admins.