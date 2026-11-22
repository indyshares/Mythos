# Mythos

[ภาษาไทย](README_TH.md) · **English**

> A cloud knowledge-management and writing workspace for novels, worldbuilding, research, and structured knowledge.

## Overview

**Mythos** is a modern, browser-based workspace for writers and knowledge workers. It combines hierarchical files and folders, live Markdown editing, internal WikiLinks, a knowledge graph, chronological story timelines, templates, version history, import/export, PWA support, and a read-only AI knowledge assistant.

The application is built with React, TypeScript, Express, Vite, and Capacitor. It can run as a web application or be packaged as an Android app.

## Key Features

- **Hierarchical workspaces** — separate projects into folders and nested Markdown notes.
- **Live Markdown editor** — edit and preview Markdown with a structured properties/frontmatter experience.
- **Internal WikiLinks** — connect ideas using `[[Note Name]]` links.
- **Knowledge graph** — visualize notes and relationships between them.
- **Story timeline** — organize events chronologically with story-date metadata.
- **Writing templates** — start new notes from characters, locations, factions, events, and custom templates.
- **AI Knowledge Assistant** — ask questions against selected workspace context using Gemini or an OpenAI-compatible provider.
- **Read-only retrieval** — the assistant can search and cite workspace notes without modifying or deleting their content.
- **Chat sessions** — retain focused conversations and their relevant citations.
- **Trash and version history** — recover deleted notes and restore earlier snapshots.
- **Import and export** — save workspace data as JSON or export Markdown content as ZIP archives.
- **Database synchronization** — optional JSON, SQLite, PostgreSQL/Supabase, or Cloudflare D1 storage.
- **Progressive Web App** — installable PWA with offline caching and automatic updates.
- **Android wrapper** — Capacitor project for generating an Android APK or AAB.

## Technology Stack

| Area | Technologies |
|---|---|
| Frontend | React 19, TypeScript, Tailwind CSS |
| Build and bundling | Vite 8 |
| Application server | Express 4, TSX |
| AI | Google Gemini SDK, OpenAI-compatible chat APIs |
| Storage | Local JSON, IndexedDB helpers, SQLite, PostgreSQL/Supabase, Cloudflare D1 |
| Mobile | Capacitor 8 for Android |
| PWA | `vite-plugin-pwa` |

## Requirements

- Node.js 20 or newer; Node.js 22 LTS is recommended
- npm or Bun
- A Gemini API key or an OpenAI-compatible provider key for AI features
- Android Studio and the Android SDK only for native Android builds

## Installation

```bash
git clone https://github.com/indyshares/Mythos.git
cd Mythos
npm install
```

Or, with Bun:

```bash
bun install
```

## Releases and Downloads

Pre-built installers are published on the [releases page](https://github.com/indyshares/Mythos/releases).
Latest release: [v0.1.0](https://github.com/indyshares/Mythos/releases/tag/v0.1.0).

Download all assets of a release with the GitHub CLI:

```bash
gh release download v0.1.0 -D installers
```

| Platform | Asset | Install |
|---|---|---|
| Windows | `Mythos_0.1.0_x64-setup.exe` | Run the installer (NSIS, per-user install). |
| macOS (Intel) | `Mythos_0.1.0_x64.dmg` | Open the DMG and drag Mythos to Applications. |
| macOS (Apple Silicon) | `Mythos_0.1.0_aarch64.dmg` | Same as above; pick this on M-series Macs. |
| Linux (Debian/Ubuntu) | `Mythos_0.1.0_amd64.deb` | `sudo apt install ./Mythos_0.1.0_amd64.deb` |
| Linux (portable) | `Mythos_0.1.0_amd64.AppImage` | `chmod +x Mythos_0.1.0_amd64.AppImage && ./Mythos_0.1.0_amd64.AppImage` |
| Android | `Mythos-v0.1.0.apk` | Copy to device and install (allow unknown sources). |
| Android (store) | `Mythos-v0.1.0.aab` | For Google Play; unsigned until signing secrets are configured. |

macOS may require right-click → Open on first launch because the binary is not notarized.
For the web version, or to run from source: `npm run dev` → http://localhost:3000.

CI build artifacts for every push are also available under the repository
[Actions runs](https://github.com/indyshares/Mythos/actions/workflows/build-all.yml); download them with
`gh run download <run-id> -D installers`. Desktop and Android builds store workspace content as real
folders and `.md` files under `Documents/Mythos`.

## Environment Variables

Create a local environment file:

```bash
cp .env.example .env
```

```dotenv
GEMINI_API_KEY="MY_GEMINI_API_KEY"
APP_URL="http://localhost:3000"
```

| Variable | Required | Description |
|---|---:|---|
| `GEMINI_API_KEY` | For Gemini | Key for Google Gemini generation and model discovery |
| `APP_URL` | Optional | Public base URL used for hosted callbacks and links |

Never commit API keys, database credentials, provider tokens, or populated `.env` files.

## Running Locally

Start the combined Vite and Express development server:

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

The Express server provides `/api` routes while Vite serves the frontend and development middleware.

## Package Scripts

| Command | Description |
|---|---|
| `npm run dev` | Run the development server |
| `npm run build` | Produce the production build in `dist/` |
| `npm start` | Start the Express server |
| `npm run preview` | Preview the Vite production build |
| `npm run lint` | Run TypeScript checking with `tsc --noEmit` |
| `npm test` | Run `test-e2e.ts` |

Bun equivalents can be used through `bun run dev`, `bun run build`, and the remaining scripts.

## Production Build

```bash
npm run build
NODE_ENV=production npm start
```

In production mode, Express serves the generated `dist/` directory and listens on port `3000`.

## AI Knowledge Assistant

The server supports multiple provider configurations:

- Google Gemini using `GEMINI_API_KEY`
- OpenAI and OpenAI-compatible services
- OpenRouter, DeepSeek, and custom router endpoints
- In-app custom API keys and base URLs

The assistant receives:

- The user's question
- Recent chat history
- Workspace instructions
- Selected or focused note content
- A map of available workspace notes

Relevant notes are identified, limited to a small context set, and included with source citations. The assistant is designed as a read-only knowledge assistant: it can read, summarize, explain, and suggest content, but should not silently modify workspace notes.

## Storage and Synchronization

Mythos includes a local JSON fallback and optional database synchronization:

- **Local JSON:** `mythos_storage.json`
- **IndexedDB:** browser-side utility support
- **SQLite:** configurable local file
- **PostgreSQL:** local or hosted server
- **Supabase:** PostgreSQL connection-string access
- **Cloudflare D1:** account, database, and API-token configuration

Database credentials should be supplied securely on the server. Back up important writing work before changing storage providers.

## PWA Installation

The Vite PWA configuration declares an installable application named **Mythos** and enables automatic service-worker updates. Modern browsers can offer:

- Add to Home Screen
- Standalone installation
- Static asset caching
- In-app offline status indicators

PWA behavior does not replace regular workspace backups.

## Android Build

The repository includes an Android/Capacitor project and `capacitor.config.ts`:

```typescript
appId: "app.indyshares.mythos"
appName: "Mythos"
webDir: "dist"
```

Build and sync the Android application:

```bash
npm run build
npx cap sync android
npx cap open android
```

Detailed native implementation guidance is available in [`ANDROID_APP_SPECIFICATION.md`](ANDROID_APP_SPECIFICATION.md).

## Project Structure

```text
.
├── android/                     # Capacitor Android project
├── src/
│   ├── App.tsx                 # Main application entry component
│   ├── assets/                 # Application assets
│   ├── components/             # UI components
│   ├── context/                # React context providers
│   ├── hooks/                  # Custom hooks
│   ├── types/                  # Shared TypeScript types
│   └── utils/                  # Utility functions
├── public/                     # Public static assets
├── scripts/                    # Maintenance and build scripts
├── data/                       # Local data resources
├── server.ts                   # Express server and API routes
├── test-e2e.ts                 # End-to-end test script
├── vite.config.ts              # Vite and PWA configuration
├── capacitor.config.ts         # Android packaging configuration
├── package.json
└── mythos_storage.json         # Local fallback data
```

## API Overview

The server includes routes for:

- Health checks
- Gemini or custom-provider connection tests
- AI chat and workspace-context retrieval
- Local/database synchronization
- Chat history retrieval
- Static frontend serving

Keep provider keys out of frontend source files. Use server-side environment variables or secure user settings.

## Security and Privacy

- AI requests may transmit the question and selected note context to an external provider.
- API keys must not be committed to Git or embedded in publicly distributed frontend bundles.
- Local JSON, SQLite, or browser storage must be handled according to the sensitivity of the stored material.
- Export or back up workspace data regularly.

## Testing

Run the TypeScript check and end-to-end script:

```bash
npm run lint
npm test
npm run build
```

Because the test setup depends on live browser/server behavior and external providers, configure required services before running provider-specific tests.

## Desktop (Tauri v2) and native permissions

Mythos targets web, Android (Capacitor 8) and desktop (Tauri v2: Windows, macOS, Linux).

Host prerequisites:

- **Desktop**: Rust via [rustup](https://rustup.rs), plus platform toolchains — Windows: MSVC Build Tools + WebView2 Runtime; macOS: `xcode-select --install`; Linux (Ubuntu/Debian): `libwebkit2gtk-4.1-dev build-essential curl wget file libxdo-dev libssl-dev libayatana-appindicator3-dev librsvg2-dev`.
- **Android**: JDK 21 (required by Capacitor 8 plugins) and Android SDK (`ANDROID_HOME`/`ANDROID_SDK_ROOT`), or Android Studio.

Commands:

```bash
npm run tauri:dev        # desktop dev (loads http://localhost:3000 from `npm run dev`)
npm run tauri:build      # desktop installers in src-tauri/target/release/bundle/
npm run cap:sync         # copy dist/ + Capacitor plugins into the native projects
npm run cap:android      # sync + open Android Studio
```

Permissions live in three places:

- Desktop: `src-tauri/capabilities/default.json` (core/dialog/notification + scoped filesystem paths). Tauri does not prompt at runtime — capabilities are the grant.
- Android: `android/app/src/main/AndroidManifest.xml` (storage/media + `POST_NOTIFICATIONS`).
- Shared TypeScript API: `src/utils/permissions.ts`.

```ts
import { getPlatform, checkPermission, requestPermission, pickDirectory } from './utils/permissions';

// getPlatform(): 'web' | 'capacitor' | 'tauri'
if ((await checkPermission('files')) !== 'granted') {
  await requestPermission('files'); // 'granted' | 'denied' | 'prompt' | 'unsupported'
}
const folder = await pickDirectory(); // null when cancelled/unsupported
await requestPermission('notifications');
```

Native storage (Tauri desktop / Capacitor Android): workspaces, folders and notes are kept as real directories and real `.md` files under `Documents/Mythos`. The web app keeps the existing localStorage JSON format. Non-document state (workspace icon/description, AI sessions, templates, versions, provider keys) stays in localStorage/IndexedDB. Export produces a ZIP containing only `.md` files with folder structure preserved; JSON export was removed.

Clearing app data:

```ts
import { clearLocalAppData } from './utils/resetAppData';
await clearLocalAppData(); // clears Mythos localStorage, idb-keyval and PWA caches, then reloads
```

Manual equivalent in DevTools: Application → Local Storage → remove all `mythos_*` keys, Application → IndexedDB → delete `keyval-store`, Application → Storage → Clear site data. Server-side data lives in `mythos_storage.json` and `data/chat_history.json`; both are reset to empty sessions/contexts in the repo.

Build outputs (all relative to the repo root):

| Platform | Output |
|---|---|
| Web | `dist/` |
| Android APK (debug) | `android/app/build/outputs/apk/debug/app-debug.apk` |
| Android AAB (release) | `android/app/build/outputs/bundle/release/app-release.aab` (signed when keystore env vars are set) |
| Windows | `src-tauri/target/release/bundle/nsis/*.exe`, `.../msi/*.msi` |
| macOS | `src-tauri/target/release/bundle/dmg/*.dmg`, `.../macos/*.app` |
| Linux | `src-tauri/target/release/bundle/appimage/*.AppImage`, `.../deb/*.deb` |

Android release signing reads `KEYSTORE_FILE`, `KEYSTORE_PASSWORD`, `KEY_ALIAS`, `KEY_PASSWORD` from environment variables (see `android/app/build.gradle`). In CI, also set the `ANDROID_KEYSTORE_BASE64` secret.

CI builds all four targets via `.github/workflows/build-all.yml`; artifacts (APK/AAB, MSI/EXE, DMG, DEB/AppImage) are uploaded per job on push, release, or manual dispatch.

## Contributing

1. Fork the repository.
2. Create a focused branch:

   ```bash
   git switch -c feature/my-feature
   ```

3. Keep changes scoped and document new environment variables or storage requirements.
4. Run lint, tests, and the production build.
5. Open a pull request with a clear summary and test plan.

## License

The original Mythos application and server source code maintained by IndyShares is licensed under **GNU GPL v3 or later**. This software license does not apply to user-created content, third-party dependencies, or non-code assets unless a separate notice expressly says otherwise. See [`LICENSE.txt`](LICENSE.txt) for the complete license and scope details.

## Links

- Repository: https://github.com/indyshares/Mythos
- Releases and downloads: https://github.com/indyshares/Mythos/releases
- CI build artifacts: https://github.com/indyshares/Mythos/actions/workflows/build-all.yml
- Thai documentation: [README_TH.md](README_TH.md)
