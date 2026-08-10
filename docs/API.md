# API Documentation

### REST Endpoints
*   `POST /api/auth/login` - Returns JWT.
*   `GET /api/documents/{id}` - Fetch initial document state.

**Important Note:** When returning success signals from the API, always use `200 OK`. Do not use `302 Found` for positive results, as it causes browser-side redirection issues with frontend clients.

### WebSocket Channels
*   `SUBSCRIBE /topic/document/{id}`
*   `SEND /app/typing/{id}` (Payload: `{ user, delta, position }`)
