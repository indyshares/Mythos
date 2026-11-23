# Native workspace creation, context menu and icon consistency Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: use executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax.

**Goal:** On native apps, create a workspace from a typed name or from a chosen folder automatically; replace the desktop native right-click menu with an in-app tool menu; make Android icons/splash use the same feather artwork as the Tauri app.

**Architecture:** Shared React frontend. `nativeStore.ts` owns disk paths. `StorageLocationPicker.tsx` exposes two creation modes. MarkdownEditor gains a custom context menu. Android `res/` PNGs are regenerated from `public/pwa-maskable.png` with sharp.

**Tech Stack:** React 19, TypeScript, Tauri 2, Capacitor 8, @tauri-apps/plugin-dialog, @tauri-apps/api/path, sharp, js-yaml.

**Spec:** user request 2026-11-23 (this conversation).

## Global Constraints
- Default mode: name + Create → `Documents/Mythos/<name>/`.
- Choose-folder mode: chosen directory itself is the workspace, name = folder basename, created immediately after pick (no Create click).
- Desktop right-click must not show native browser/WebView context menu.
- All mobile icons and splash must use the white-background purple feather source (`public/pwa-maskable.png`), same as PC.
- Do not install large SDK/emulator packages; network is slow.

## Review Focus
- Choosing a folder whose parent contains unrelated siblings must not import them as workspaces.
- Existing `.md` files inside a chosen folder must not be deleted by reconciliation.
- Canceling the folder picker must leave state untouched.
- Raw Markdown mode also needs the custom tool menu.
- Regenerated Android icons must keep adaptive-icon XML references valid.

---

### Task 1: Two native workspace creation modes

**Files:**
- Modify `src/utils/storage/nativeStore.ts`
- Modify `src/components/StorageLocationPicker.tsx`
- Modify `src/context/WorkspaceContext.tsx`
- Modify `src/components/TopBar.tsx`
- Modify `src/components/MobileWorkspaceSheet.tsx`

**Interfaces:**
- Produces `createWorkspaceFromFolder(name: string): void` on context.
- `StorageRoot` gains `singleWorkspace?: string` (only that directory under root is a workspace).

Steps:
- [ ] **Plan:** define `singleWorkspace` semantics: `baseDir` = parent of chosen folder; `readNativeTree` only considers that directory; `writeNativeTree` keeps existing relative mapping.
- [ ] **Do:** extend `StorageRoot`, `chooseDesktopFolder(): Promise<{parent,name}|null>` using `basename`/`dirname`; picker calls it and reports `{parent,name}` without auto-settings root; context sets root + clears state and calls `createWorkspace(name)`.
- [ ] **Check:** `npm run lint`; run Tauri dev, click Choose folder, pick an empty folder, confirm workspace created with folder name and no Create click; confirm unrelated siblings not imported.
- [ ] **Act:** commit `feat: add choose-folder workspace creation`.

### Task 2: Custom right-click tool menu on desktop

**Files:**
- Modify `src/components/MarkdownEditor.tsx`

**Interfaces:**
- Consumes `isTauri()` from `src/utils/permissions.ts`.
- Reuses existing formatting functions (`applyRichFormat`, `handleInsertInlineCode`, `handleInsertHighlight`, `handleInsertTaskCheckbox`, `handleUndo`, `handleRedo`, `insertFormatting`).

Steps:
- [ ] **Plan:** menu appears only when `isTauri()`; preserve link tooltip behavior; suppress native menu on rich editor and raw textarea.
- [ ] **Do:** add `toolContextMenu` state, unconditional `preventDefault()` in `handleRichEditorContextMenu` for non-link targets, wrap raw textarea with same handler; render fixed menu with formatting items and outside-click/Escape close.
- [ ] **Check:** `npm run lint`; in Tauri dev right-click normal text → custom menu, native menu gone; formatting item applies to selection.
- [ ] **Act:** commit `feat: add desktop context tool menu`.

### Task 3: Unify mobile icons with PC feather artwork

**Files:**
- Modify `vite.config.ts`
- Modify `src/components/PWAInstallButton.tsx`
- Modify `src/components/MobileMoreSheet.tsx` (broken logo path)
- Regenerate `android/app/src/main/res/mipmap-*/ic_launcher*.png`
- Regenerate `android/app/src/main/res/drawable*/splash.png`
- Regenerate `public/pwa.png`, `public/apple-touch-icon.png`

**Interfaces:**
- Source: `public/pwa-maskable.png` (1254² RGBA feather).
- Use `sharp` with `fit: 'contain'` on white background for launcher/splash.

Steps:
- [ ] **Plan:** keep adaptive-icon XML unchanged; regenerate only PNGs; point PWA manifest and in-app logos at feather assets.
- [ ] **Do:** generate PNGs at existing dimensions; update manifest `any` icon to `/pwa.png` (now feather) and remove broken logo reference.
- [ ] **Check:** `npm run build`; verify Android mipmap/splash PNGs contain feather; verify no reference to missing `mythos_logo*.jpg` remains.
- [ ] **Act:** commit `feat: unify Android icons with desktop feather artwork`.

### Task 4: Full verification

**Files:** none (commands only)

Steps:
- [ ] **Plan:** verify web + native compile and all CI targets.
- [ ] **Do:** `npm run lint`, `npm test`, `npx cap sync android`, `gh workflow run build-all.yml --ref main`.
- [ ] **Check:** all five CI jobs success; artifacts uploaded.
- [ ] **Act:** report result; do not install emulator (network constraint).
