# Strict Copilot Execution Rules

1. **Zero Hardcoded Secrets**: Use `process.env` / `os.getenv` exclusively.
2. **Strict Typing**: TypeScript `strict: true`, zero `any` types. Pydantic `BaseModel` for all FastAPI payloads.
3. **Clean Architecture**: Controller -> Service -> Repository pattern for backend routes.
4. **Handling Errors**: Standardized JSON errors with HTTP status codes (400, 401, 403, 404, 500).
5. **No Placeholder Code**: Write fully implemented logic. Do not write `// TODO: implement this`.