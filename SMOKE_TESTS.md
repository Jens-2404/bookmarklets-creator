# Smoke Tests (MVP)

Run these quick checks after a fresh install or before release.

## Setup
- `npm install`
- `npm run dev`

## Editor & Validation
- Load app: editor shows starter code.
- Change code: editor updates, markers appear for risky patterns.
- Enter syntax error: Generate is disabled and error list shows.
- Click "Jump to issue": cursor moves to first marker.

## Generator & Export
- Click Generate with valid code: bookmarklet string appears.
- Copy to clipboard: clipboard contains `javascript:` string.
- Drag to bookmarks bar: link is draggable when generated.
- Warnings present: save disabled until acknowledge checkbox is ticked.

## Preview & Console
- Preview runs without crashing.
- Console logs from bookmarklet appear in preview console.
- Filter console by level and clear entries.
- Download log creates `bookmarklet-console.txt`.

## Manager & Persistence
- Save bookmarklet: item appears in library.
- Reload page: saved items persist (IndexedDB).
- Edit item: fields populate and Update modifies entry.
- Delete item: entry removed and stays removed after reload.
- Search and tag filter reduce results correctly.

## Theme & Settings
- Toggle Dark/Light: theme updates immediately.
- Reload page: theme persists.
