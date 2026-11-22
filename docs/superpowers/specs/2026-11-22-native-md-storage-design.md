# Native Markdown storage (approved approach)

## Intent
Desktop (Tauri v2) and Android (Capacitor) store workspace content as real folders
and real `.md` files on disk. Web keeps localStorage JSON.

## Decisions (approved)
- Root: `Documents/Mythos` on both native targets.
- Content: workspaces = directories, folders = directories, notes = `.md` files
  with frontmatter inline. No JSON files for content.
- Non-content state (workspace icon/description, AI sessions, templates, versions,
  provider keys, UI state) stays in localStorage / IndexedDB.
- Export: ZIP containing only `.md` files, preserving folder structure. JSON export removed.

## Design
- `src/utils/storage/nativeStore.ts` abstracts Tauri fs plugin and Capacitor
  Filesystem behind `readTree()` / `writeTree()`.
- On native startup, `readTree()` hydrates workspaces/folders/files into context.
- On native state change, `writeTree()` reconciles disk: creates dirs, writes `.md`
  files, moves soft-deleted items into `.trash/<path>`, removes stale `.md` files.
- Path mapping uses sanitized names; IDs are path-derived when hydrating.
- Export UI calls only `exportWorkspaceAsMarkdownZip()` (`.md` entries only).

## Non-goals
- No import of external Markdown into the tree in this change.
- No change to web localStorage behavior.
- No change to server sync / AI config storage.
