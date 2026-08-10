# CodeSync: Comprehensive Security Architecture & Privacy Policy

This document provides an exhaustive overview of the security measures, data protection protocols, and legal privacy framework governing the **CodeSync** platform.

---

## 🔒 1. Credential Security & Password Hashing
* **Overview:** Protects user authentication credentials against database compromise.
* **Implementation:** Utilize **Spring Security** alongside **BCryptPasswordEncoder** to salt and hash all user passwords before committing them to the PostgreSQL database. Plain-text passwords are never stored in memory or persistent storage.

---

## 🛡️ 2. Transport Layer Security (TLS/HTTPS) & Data Encryption
* **Overview:** Encrypts all data in transit across public and private networks.
* **Implementation:** Enforce TLS 1.2 or 1.3 across all incoming and outgoing connections between clients, the Next.js frontend, the Spring Boot backend, and cloud databases. Cloud providers (Neon and Upstash) are configured to require secure SSL connection strings (`jdbc:postgresql://...&sslmode=require`).

---

## 🔑 3. Environment Variable & Secret Isolation
* **Overview:** Prevents API keys, database credentials, and internal secrets from leaking into client bundles or version control.
* **Implementation:** Store all sensitive credentials exclusively in server-side environment variables (`.env` or platform secret managers). Secrets are injected at runtime via Spring configuration properties.

---

## 🍪 4. Secure Session Management & Cookies
* **Overview:** Defends against session hijacking, Cross-Site Scripting (XSS), and Cross-Site Request Forgery (CSRF).
* **Implementation:** Issue authentication tokens or session identifiers with strict flags (`HttpOnly`, `Secure`, and `SameSite=Strict`), blocking client-side JavaScript access to sensitive cookie contexts.

---

## 📦 5. Sandboxed Code Execution Proxy
* **Overview:** Ensures user-submitted scripts cannot compromise host infrastructure, backend servers, or databases.
* **Implementation:** Route all execution payloads through a secure Spring Boot backend proxy (`/api/execute`) to hide compiler API keys from the frontend bundle. Execution is offloaded to isolated, network-disabled containers with resource limits (512MB RAM, 2 CPUs, 30-second timeout).

---

## 🗄️ 6. Row-Level Security (RLS) & Access Control
* **Overview:** Enforces strict boundary isolation so users can only access their own private data and session states.
* **Implementation:** Apply PostgreSQL Row-Level Security (RLS) policies and application-layer ownership validation (`user_id` checks) on all queries targeting sensitive records. Database role permissions follow the principle of least privilege.

---

## ⚖️ 7. Platform Privacy Policy & Limitation of Liability

### A. Commitment to Privacy
CodeSync makes commercially reasonable efforts to maintain the privacy, confidentiality, and integrity of user data, including encrypted credential storage, secure session handling, and encrypted transport layers.

### B. Limitation of Liability for External Attacks
* **No Absolute Guarantee:** While we employ industry-standard security practices, no method of transmission over the internet or electronic storage is 100% secure. We cannot guarantee absolute security.
* **External Attacks & Force Majeure:** CodeSync, its maintainers, and its operators disclaim all liability for any unauthorized access, data breaches, data loss, or system compromises resulting from sophisticated external attacks, zero-day exploits, malicious threat actors, distributed denial-of-service (DDoS) events, or unforeseen infrastructure failures outside our reasonable control.
* **User Acknowledgment:** By utilizing CodeSync, users explicitly agree that the platform is provided on an "as-is" and "as-available" basis, and operators assume no legal liability for unforeseen security breaches caused by malicious third parties.
