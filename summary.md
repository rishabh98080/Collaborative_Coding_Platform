# CodeSync: Comprehensive Project Overview & Summary

This document serves as the master summary for the **CodeSync** real-time collaborative coding platform, consolidating its architectural philosophy, feature sets, future extensions, and frontend UI/UX design specifications.

---

## 🏛️ 1. Architecture & Core Workflow

* **Ephemeral, Memory-First Engine:** CodeSync bypasses persistent database storage during active coding sessions. Keystrokes flow entirely through an in-memory STOMP broker over WebSockets for sub-millisecond multi-user synchronization.
* **Dynamic Room-Hash Routing:** Visiting the root domain (`/`) automatically provisions a unique client-side random room hash (`/[roomId]`). Sharing the URL instantly pulls collaborators into the identical memory-backed session.
* **Late-Joiner State Recovery:** The Spring Boot backend maintains a lightweight thread-safe `ConcurrentHashMap` cache in RAM, allowing refreshing or late-joining peers to instantly pull current room state before typing.

---

## ✨ 2. Implemented Features

1. **Real-Time Collaborative Editing:** Low-latency Monaco Editor synchronization via SockJS and STOMP.
2. **Cursor & Scroll Preservation:** Injects remote text changes smoothly without disrupting local cursor positions.
3. **Synchronized Language Selector:** Supports major languages (Python, Java, C++, TypeScript, Go, etc.) with real-time broadcasting across peers.
4. **Secure Code Execution Proxy:** Routes code scripts through a secure Spring Boot backend proxy to sandboxed remote execution containers (`onlinecompiler.io`), keeping API credentials hidden from the client bundle.
5. **Integrated Terminal Console:** Streams execution outputs and compilation errors directly into a collapsible bottom drawer.
6. **One-Click Share:** Instantly copies the active session URL to the clipboard.
7. **Live User Presence & Avatars:** Tracks real-time WebSocket connections and dynamically displays active collaborators as random animal emojis in the header.
8. **Interactive Standard Input (stdin):** Allows developers to pass runtime console inputs dynamically alongside their code.
9. **Personalized UI Themes:** Dynamic selection of dark, light, and high-contrast editor themes configured per-client.

---

## 🚀 3. Future Roadmap & Extensions

* **Multi-User Real-Time Cursors:** Visual real-time remote user carets inside the editor.
* **Persistent Gist Saves:** Optional button to store code snapshots permanently to PostgreSQL via permalinks (`/gist/{hash}`).
* **Built-In Peer Chat:** Dedicated WebSocket-driven text sidebar for in-room communication.

---

## 🎨 4. Frontend UI/UX Design System

* **Dark-Mode-First Aesthetics:** Built on deep slate and obsidian backgrounds (`#090d16`, `#111827`) to minimize eye strain.
* **Layout Structure:** Comprises a fixed top navigation header, an expanded Monaco editor canvas, and a clean split-pane bottom execution console.
* **Micro-Interactions:** Smooth transitions, tooltip title reveals, and clipboard feedback checkmarks.
