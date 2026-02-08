# z-ui

Small fullstack SvelteKit app for searching Z-Library, downloading books, and syncing a personal library/progress data.

It runs as a single SvelteKit service (Svelte 5 + adapter-node), with API routes and server-side logic in the same repo.

## Quick start

```bash
npm install
npm run dev
```

Open `http://localhost:5173`.

## Environment

Copy `.env.example` to `.env` and fill in required values.

Main groups:
- Turso/libSQL database config
- Cloudflare R2 (S3-compatible) storage config
- Basic auth credentials for API access

## Useful scripts

```bash
npm run dev
npm run build
npm run preview
npm run check
```

## Project layout

- `src/routes`: Svelte pages + API endpoints (`+server.ts`)
- `src/lib/client`: browser-facing API client wrappers
- `src/lib/server/domain`: domain entities + pure business rules
- `src/lib/server/application`: use-cases + ports + composition wiring
- `src/lib/server/infrastructure`: DB/repository/storage/external clients

## Current status

The codebase recently moved to a cleaner separation of concerns.
Controllers are thinner than before, and most orchestration now lives in use-cases.

If you need implementation details for extending the app, read:
- `docs/DEV_GUIDE.md`
