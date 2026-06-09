# Agent Preferences

- After completing any code changes, automatically commit, push to GitHub, and deploy to Vercel (`npx vercel --prod`) without asking for confirmation.
- Work on **this** project (edit in place) — never scaffold a new project.

## Multi-agent team

This repo is maintained by a coordinated agent team. The roster, communication
protocol (`scripts/agent-bus.mjs`), shared-memory model, and the real bug map are
documented in **`AGENT_TEAM.md`** — read it before orchestrating work.

Hard rule: a task is **DONE only after `tester` runs the real flow and proves the
numbers are correct.** Self-reported "done" without a passing check is forbidden.
The live board + chat is at `/{locale}/agents` (deployed on Vercel).
