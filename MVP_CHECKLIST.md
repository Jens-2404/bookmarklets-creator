# MVP Checklist (PRD-aligned)

## Core Features
- [x] Editor with JavaScript syntax highlighting.
- [x] Automatic bookmarklet generation (`javascript:` + minify + encode).
- [x] Live preview in sandboxed iframe.
- [x] Local persistence (IndexedDB for bookmarklets, LocalStorage for settings).
- [x] Library list with name and tags.
- [x] Copy-to-clipboard and drag-and-drop export.

## Security
- [x] No server-side execution.
- [x] iframe sandbox isolation.
- [x] Static analysis warnings for risky APIs (eval/fetch/etc).

## UX
- [x] Desktop-first layout.
- [x] Clear error and warning states.
- [x] Empty states in lists and console.

## Out of Scope
- [x] Accounts, backend, sharing.
- [x] No-code builder.
- [x] AI features.

## Open Items / Review Notes
- [x] Manual test pass recorded?
- [x] Known limitations documented?

## Manual Test Pass
- Date: 11.01.2026
- Tester: Jens Koehler
- Notes: Alle obigen Checks durchgeführt und positiv getestet.
