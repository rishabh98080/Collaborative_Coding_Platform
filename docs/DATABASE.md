# Database Schema

**PostgreSQL Tables:**
*   `users`: id, username, password_hash
*   `documents`: id, title, content, owner_id
*   `sessions`: id, document_id, active_users
