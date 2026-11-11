# Testing Strategy

- **Backend**: `pytest` for FastAPI routes, vector calculation assertions.
- **Frontend**: Vitest & Playwright (already configured in `frontend/vitest.config.ts` and `frontend/playwright.config.ts`).
- **Agent Testing**: Mocking LLM responses during multi-agent test runs to prevent token usage during automated test suite passes.