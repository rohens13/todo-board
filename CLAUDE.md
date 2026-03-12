# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm start          # Start the server on http://localhost:3001
node server.js     # Equivalent to npm start
```

There is no build step, no bundler, no transpilation, and no test suite. The server serves `/public` as static files directly.

## Architecture

**Stack:** Node.js + Express 5 backend, vanilla JS frontend — no frameworks, no build tools.

**Single data file:** All state (tasks, columns, companies, podcasts) is stored in `data.json`. `server.js` reads this file on every request via `loadData()` and writes it on every mutation via `saveData()`. There is no database.

**Frontend state pattern (`public/app.js`):** A single global `data` object mirrors the server state. Mutations follow this flow:
1. Call `saveStateForUndo()` to snapshot `data` before the change
2. Optimistically update `data` in memory
3. Fire the relevant `fetch()` API call to persist
4. Call `renderBoard()` (or the relevant render function) to re-render from scratch

Undo works by storing deep-cloned snapshots of `data` in `undoStack` (max 20), then restoring via `PUT /api/data`.

**IDs:** All records use `Date.now().toString()` as their primary key.

**Tabs and rendering:** Each tab (Board, HubSpot, DD, Podcasts) has its own render functions in `app.js`. Tabs are shown/hidden by toggling a `hidden` class — they are not separate pages or routes.

**Theming:** CSS custom properties defined in `:root` (dark, default). Additional themes are applied by adding a class to `body` (`theme-light`, `theme-ocean`, `theme-forest`, `theme-sunset`). Theme is persisted in `localStorage` under the key `theme`. The legacy `light-mode` class still works for backwards compatibility.

**YouTube import (Podcasts tab):** Uses Server-Sent Events (`/api/podcasts/import-youtube`) to stream progress to the client. The server fetches the YouTube channel RSS feed, scrapes auto-captions via the `timedtext` API, then calls Claude (`claude-sonnet-4-6`) to extract investment ideas and a structured JSON summary.

**HubSpot integration:** All HubSpot API calls are proxied through the server using `HUBSPOT_API_KEY` from `.env`. The `/api/hubspot/funnel` endpoint supports period filters and per-owner breakdowns. Clicking a funnel stage row opens a slide-in deals panel populated by `/api/hubspot/funnel/deals`.

**Claude API calls:** Made directly via raw HTTPS requests in `server.js` (`callClaude()`) — no Anthropic SDK. Uses `ANTHROPIC_API_KEY` from `.env`.

**File uploads:** `multer` with memory storage. DOCX files parsed with `mammoth`, Excel files with `xlsx`. 20 MB file size limit.

## Environment

Required `.env` variables:
- `HUBSPOT_API_KEY` — HubSpot private app token
- `ANTHROPIC_API_KEY` — Anthropic API key (used for podcast episode analysis)

## Git workflow

After every change: commit with a descriptive message and push to `origin main`.
Remote: `https://github.com/rohens13/todo-board`
