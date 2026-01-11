# Bookmarklets Creator (MVP)

Client-only web app to create, test, manage, and export bookmarklets.

## Goals
- Easy bookmarklet creation with a JS editor.
- Safe preview via iframe sandbox.
- Local persistence without a backend.
- Fast export via copy and drag-and-drop.

## MVP Scope
In scope:
- JavaScript editor with syntax highlighting.
- Automatic `javascript:` generation with minify and URL encoding.
- Sandbox preview and console output.
- IndexedDB storage for bookmarklets, LocalStorage for settings.
- Bookmarklet list with name and tags.
- Copy-to-clipboard and drag-and-drop export.

Out of scope:
- Accounts, backend, sharing.
- No-code builder.
- AI features (post-MVP only).

## Tech Stack
- React + Vite + TypeScript.
- Client-only architecture.

## Project Structure (Target)
- `src/app`: App shell, routes, layout.
- `src/editor`: Code editor and toolbar.
- `src/generator`: generator, minifier, validator.
- `src/preview`: sandbox iframe and controller.
- `src/manager`: bookmarklet list and store.
- `src/storage`: IndexedDB and settings.
- `src/security`: static analysis.
- `src/types`: shared types.

## Security Notes
- No server-side code execution.
- iframe sandbox with strict attributes.
- Static analysis warns on risky APIs (no hard blocks).

## Getting Started
Install:
```bash
npm install
```

Run dev server:
```bash
npm run dev
```

Build:
```bash
npm run build
```

Preview build:
```bash
npm run preview
```

## Smoke Tests
See `SMOKE_TESTS.md`.

## Release Checklist
See `RELEASE_CHECKLIST.md`.

## Known Limitations
- No accounts or syncing.
- No sharing or community library.
- AI assistance is not part of MVP.

## Changelog
See `CHANGELOG.md`.

## Versioning
We follow SemVer (MAJOR.MINOR.PATCH).

## Contributing
See `CONTRIBUTING.md`.

## License
MIT. See `LICENSE`.

## AI Phase
See `AI_PHASE.md`, `AI_UI.md`, `AI_API.md`, and `AI_PROMPTS.md`.
