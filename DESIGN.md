# Frontend Design System & UI UX Guidelines

**Core Aesthetic:** Modern, Dark Mode, Minimalist IDE.
**CSS Framework:** Tailwind CSS. Do NOT write custom CSS files. Use Tailwind utility classes exclusively.

## Layout Structure
The application uses a full-screen, non-scrolling layout (`h-screen w-screen overflow-hidden`).

1.  **Top Navbar (`h-14`):**
    *   **Background:** Dark gray/black (`bg-gray-900`).
    *   **Left:** Project Title ("CodeSync MVP") in a clean, sans-serif font.
    *   **Center:** Document ID / Title.
    *   **Right:** 
        *   WebSocket Connection Status Indicator (Green dot for connected, Red for disconnected).
        *   "Share" button that copies the current URL to the clipboard.

2.  **Main Content Area (`flex-1 flex`):**
    *   **Left Sidebar (Width: `w-64`):**
        *   **Background:** Slightly lighter gray (`bg-gray-800`).
        *   **Content:** "Active Users" list. Shows avatars or usernames of people currently in the WebSocket session.
    *   **Editor Window (Remaining space: `flex-1`):**
        *   This is where `<Editor />` from `@monaco-editor/react` lives.
        *   **Theme:** MUST be set to `vs-dark`.

## Component Rules
*   **Buttons:** Indigo/Blue accents (`bg-indigo-600 hover:bg-indigo-700 text-white rounded-md px-4 py-2`).
*   **Typography:** Use standard Tailwind Sans for the UI, and Monaco's default monospace for the editor.
*   **State Feedback:** Ensure loading states (like while the WebSocket connects) are visually represented, perhaps with a simple pulsing Tailwind animation (`animate-pulse`).