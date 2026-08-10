# Architecture Rules

*   **State Management:** For the MVP, active document state is kept in memory/PostgreSQL. Redis is deferred to post-MVP.
*   **Communication:** 
    *   REST for standard CRUD (Auth, Document creation).
    *   WebSockets (STOMP) for real-time keystroke broadcasting.
