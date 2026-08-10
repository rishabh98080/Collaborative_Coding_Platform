# CodeSync Collaborative Platform - Features

This document outlines the features currently implemented in the CodeSync real-time collaborative code editor MVP. The platform relies on a modern Next.js frontend and a lightweight, memory-only Spring Boot backend.

## 🚀 Core Features

### 1. Pure Real-Time Collaborative Editing
- Built exclusively with WebSockets (STOMP over SockJS) for instantaneous, low-latency collaboration.
- Uses a pure memory-only architecture—there is no database polling or latency bottlenecks during active typing sessions.

### 2. Ephemeral Dynamic Rooms
- Zero manual room creation overhead.
- When visiting the root URL (`/`), users are instantly redirected to a unique, dynamically generated room hash (e.g., `/[roomId]`).
- Rooms exist statelessly via the URL.

### 3. Smart Editor Syncing
- Integrated with the **Monaco Editor** (the engine behind VS Code).
- **Cursor Preservation:** Incoming remote text changes are intelligently injected while preserving your exact local cursor position, preventing jarring screen jumps while collaborating.

### 4. Late-Joiner & Refresh Hydration
- The Spring Boot backend maintains a lightweight "short-term memory" (a thread-safe `ConcurrentHashMap`) in server RAM.
- When a user refreshes the page or joins a room late, the application instantly fetches the current room state (code and selected language) and pre-populates the editor before they even type a character.

### 5. Collaborative Language Selection
- A dynamic language dropdown lets users switch the syntax highlighting on the fly.
- **Synced Selection:** Changing the language locally instantly broadcasts the change to all other collaborators in the room, keeping everyone's editor environments perfectly aligned.
- **Supported Languages:** JavaScript, TypeScript, Python, Java, C++, C, C#, Go, Rust, PHP, Ruby, and Plain Text.

### 6. Secure Remote Code Execution
- A built-in "Run Code" button allows you to execute the current script directly in the browser.
- **Secure Backend Proxy:** Execution requests are sent to a secure Spring Boot REST endpoint (`/api/execute`), which attaches your hidden API key and forwards it to the isolated, sandboxed containers provided by `onlinecompiler.io`.
- Prevents any API keys from leaking to the frontend.

### 7. Integrated Output Terminal
- A dedicated console panel sits neatly beneath the editor.
- Instantly streams the standard output (or compilation errors) returned from the remote execution servers directly into the UI.

### 8. Frictionless Sharing
- A one-click "Share Room URL" button instantly copies the current room's link to the user's clipboard, making it incredibly easy to invite collaborators on the fly.
