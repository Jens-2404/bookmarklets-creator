# AGENTS.md

This file aggregates the project guidance found in the local markdown docs and
defines required subagents for this repository.

## Project Summary
- Product: Bookmarklets Creator (client-only web app).
- Goal: Let users create, test, manage, and export bookmarklets without a backend.
- MVP focus: Editor + generator + preview sandbox + local storage + export.
- Desktop-first UX; keep scope tight and avoid overengineering.

## MVP Scope
In scope:
- JavaScript code editor with syntax highlighting.
- Automatic bookmarklet generation (javascript: + minify + URL encode).
- Sandbox preview via iframe.
- Local persistence (IndexedDB for data, LocalStorage for settings).
- Bookmarklet list with name and tags.
- Copy-to-clipboard and drag-and-drop export.

Out of scope:
- Accounts, backend, sharing, no-code builder.
- AI features (post-MVP only).

## Architecture (Target)
High-level structure (planned):
- `src/app`: App shell, routes, layout.
- `src/editor`: Code editor + toolbar + editor utilities.
- `src/generator`: bookmarklet generator, minifier, validator.
- `src/preview`: sandbox iframe and preview controller.
- `src/manager`: bookmarklet list + store.
- `src/storage`: IndexedDB + settings.
- `src/security`: static analysis.
- `src/types`: shared types.

Key data model:
```
Bookmarklet {
  id: string
  name: string
  description?: string
  tags: string[]
  sourceCode: string
  generatedCode: string
  createdAt: timestamp
  updatedAt: timestamp
}
```

## Security Constraints
- No server-side execution.
- Use iframe sandbox (allow-scripts, avoid allow-same-origin).
- Static analysis for risky APIs (warn, do not block).
- Keep user code isolated; no network requests in generated bookmarklets.

## Task Focus (Condensed)
Foundation:
- Initialize repo, Vite + React + TS, ESLint, basic layout.
Editor:
- Monaco/CodeMirror integration, JS mode, error highlighting, toolbar.
Generator:
- javascript: wrapper, minify (Terser), URL encode, validator rules.
Preview:
- iframe sandbox, injection, console capture, error handling.
Persistence:
- Bookmarklet model, IndexedDB store, list, tags/search.
Export:
- Copy, drag-and-drop, empty states, toasts.
MVP close:
- Smoke tests, README, scope check.

## Subagents (Required)
Use these specialized subagents when their domain matches the task.

- Frontend Architect: `agents/frontend-architect.md`
- Security & Sandbox Specialist: `agents/security-and-sandbox-specialist.md`
- Bookmarklet Generator & Logic: `agents/bookmarklet-generator-and-logic.md`
- AI & Future Features (Post-MVP): `agents/ai-and-future-features.md`
- Product Owner & QA: `agents/product-owner-and-qa.md`
- Data & Storage: `agents/data-and-storage.md`

## Subagent Mapping (Hint)
- Frontend Architect -> `src/app`, `src/editor`, `src/manager`
- Security Specialist -> `src/security`, `src/preview`
- Generator -> `src/generator`
- Data & Storage -> `src/storage`, `src/manager`
- Product/QA -> acceptance + README
- AI/Future -> post-MVP planning only

## Operating Principles
- Keep MVP minimal and robust.
- Prefer client-only solutions; no backend assumptions.
- Use warnings (not blocking) for risky APIs.
- Favor maintainable, explicit code over cleverness.
