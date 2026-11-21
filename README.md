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

See [`LICENSE.txt`](LICENSE.txt) for the repository license.

## Links

- Repository: https://github.com/indyshares/Mythos
- Thai documentation: [README_TH.md](README_TH.md)
