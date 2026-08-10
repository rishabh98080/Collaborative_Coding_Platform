# Real-Time Collaborative Coding Platform

A full-stack real-time collaborative coding platform designed for distributed teams to edit, synchronize, and manage code together with low-latency updates.

**Author:** Rishabh Kumar

---

## Overview

This project is an enterprise-style collaborative code editor built around a real-time synchronization layer. It combines a Java/Spring Boot backend with a React + TypeScript frontend and Monaco Editor to provide a modern in-browser coding experience.

The platform is designed to support:
- multi-user code editing in real time
- session-based collaboration
- WebSocket-driven synchronization
- secure backend communication
- scalable separation between editor UI and collaboration services

---

## Key Features

- Real-time collaborative editing
- WebSocket/STOMP-based synchronization
- Monaco-based code editor in the browser
- Spring Boot backend with Spring Security
- REST APIs for application and session management
- PostgreSQL persistence layer
- Clean frontend/backend separation
- Type-safe frontend development with TypeScript

---

## Tech Stack

### Backend
- **Java**
- **Spring Boot**
- **Spring Security**
- **Spring WebSockets**
- **STOMP**
- **PostgreSQL**

### Frontend
- **React**
- **TypeScript**
- **Monaco Editor**
- **CSS**

### Tooling / Infrastructure
- **Shell scripts** for automation and local development
- **Maven / Gradle** depending on backend setup
- **npm / yarn** depending on frontend setup

---

## Architecture

The application follows a layered client-server architecture.

### 1. Frontend Layer
The frontend is responsible for:
- rendering the UI
- hosting the code editor
- managing user interaction
- connecting to backend APIs
- subscribing to WebSocket events for live updates

### 2. Backend Layer
The backend handles:
- authentication and authorization
- session and room management
- WebSocket messaging
- synchronization of editor state
- persistence of application data in PostgreSQL

### 3. Real-Time Messaging Layer
WebSocket + STOMP is used to exchange editor updates and collaboration events with minimal latency.

### 4. Database Layer
PostgreSQL stores:
- user-related data
- session metadata
- room/collaboration state
- any persisted project or document information

---

## Frontend Architecture

The frontend is structured around a component-based React application.

### Main responsibilities
- **Editor UI**
  - Monaco Editor integration
  - syntax highlighting
  - cursor and content updates
- **Collaboration UI**
  - active users
  - room/session controls
  - connection status
- **State Management**
  - editor content
  - current room/session
  - socket connection lifecycle
  - incoming remote updates

### Typical frontend flow
1. User opens the app.
2. React loads the editor and collaboration UI.
3. The app connects to backend APIs.
4. A WebSocket/STOMP connection is established.
5. Local editor changes are emitted as events.
6. Remote changes are received and applied to the editor state.

---

## Backend Architecture

The backend is built with Spring Boot and follows a modular service-oriented structure.

### Main layers
- **Controller layer**
  - exposes REST endpoints
  - receives client requests
- **Service layer**
  - contains business logic
  - coordinates collaboration and persistence
- **WebSocket layer**
  - handles live synchronization messages
  - broadcasts editor updates to connected clients
- **Security layer**
  - protects endpoints
  - manages authentication and access control
- **Repository layer**
  - interacts with PostgreSQL

### Typical backend flow
1. Client sends a request or opens a socket connection.
2. Backend authenticates and validates the request.
3. User joins a collaboration session or room.
4. Editor updates are processed in the service layer.
5. Updates are broadcast to other connected clients.
6. Important state is persisted in the database when needed.

---

## Data Flow

### Initial load flow
1. User opens the application.
2. Frontend requests session or document data from the backend.
3. Backend fetches persisted data from PostgreSQL.
4. Frontend renders the initial editor state.
5. WebSocket connection is initialized for live collaboration.

### Real-time edit flow
1. A user types in the editor.
2. Frontend captures the change event.
3. The update is sent over WebSocket/STOMP.
4. Backend receives and validates the update.
5. Backend broadcasts the update to all session participants.
6. Other connected clients apply the change to their local editor state.

### Persistence flow
1. Collaboration data or session state is updated.
2. Backend processes the incoming state change.
3. Relevant data is saved to PostgreSQL.
4. Future sessions can restore this state when needed.

---

## Project Structure

A typical structure for this repo may look like:

```text
.
├── backend
│   ├── src
│   ├── controllers
│   ├── services
│   ├── repositories
│   ├── models
│   └── config
├── frontend
│   ├── src
│   ├── components
│   ├── pages
│   ├── hooks
│   ├── services
│   └── styles
├── README.md
└── ...
```

---

## Collaboration Model

The platform is centered on shared editing sessions.

### Core concepts
- **Room / Session**: a shared collaborative workspace
- **Participant**: a connected user editing in the session
- **Editor State**: the current contents of the document
- **Sync Event**: a change message sent through the WebSocket channel

### Behavior
- Users joining the same room see synchronized editor content
- Changes made by one participant are reflected for others in near real time
- The backend acts as the coordination point for message flow and persistence

---

## Security

Spring Security is used to help protect the backend.

Potential responsibilities include:
- securing API endpoints
- validating user access to collaboration sessions
- protecting WebSocket communication
- restricting unauthorized document access

---

## Getting Started

> Update these steps based on your actual build tools and environment variables.

### Backend
```bash
cd backend
./mvnw spring-boot:run
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

### Database
Make sure PostgreSQL is running and the backend configuration points to the correct database URL, username, and password.

---

## Environment Variables

Example variables you may need:

```env
DATABASE_URL=
DATABASE_USERNAME=
DATABASE_PASSWORD=
JWT_SECRET=
WEBSOCKET_ENDPOINT=
```

Adjust these based on your actual configuration.

---

## Future Improvements

- Operational transform or CRDT-based conflict handling
- Presence indicators for connected users
- Undo/redo support
- File explorer and multi-file projects
- Code execution or preview support
- Version history and snapshots
- Chat or comments inside collaboration sessions
- Better session recovery and reconnection handling

---

## License

Add a license if you want to publish or share this project publicly.

---

## Author

**Rishabh Kumar**
