---
name: GitHub history sync
description: Why linking the existing GitHub remote does not guarantee a safe push from this workspace
---

Do not assume the workspace's local branch and the existing GitHub branch share a push-ready history just because the remote is configured. Earlier uploads created commits through the GitHub API without advancing the workspace's local Git history.

**Why:** A direct push may be rejected, and force-pushing could overwrite work already present on GitHub.

**How to apply:** Before pushing changes, compare the local and remote histories in the Git interface or with read-only Git commands. Reconcile both histories without discarding remote work, and never force-push without explicit user consent.