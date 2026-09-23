---
name: Frontend demo authentication
description: The ZensusTech login artifact intentionally uses a local demo sign-in followed by a local Azure verification screen.
---

The ZensusTech login is intentionally a frontend-only prototype. Keep the two-step demo interaction local to the browser and do not reintroduce managed authentication or server-side Azure verification unless the user explicitly requests that change.

**Why:** The product request is to demonstrate the login and Azure setup screens without connecting them to a real identity provider or Azure tenant.

**How to apply:** Preserve the current local state transitions, validation, masked client-secret field, and verification screen when making follow-up UI changes. Never record or repeat the demo password in project memory.