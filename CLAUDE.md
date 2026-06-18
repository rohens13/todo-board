# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm start          # Start the server on http://localhost:3001
node server.js     # Equivalent to npm start
```

There is no build step, no bundler, no transpilation, and no test suite. The server serves `/public` as static files directly.

## Architecture

**Stack:** Node.js + Express backend, vanilla JS frontend — no frameworks, no build tools.

**Files:**
- `server.js` — all API routes and server logic (~1100 lines)
- `public/app.js` — all frontend logic for Board, HubSpot, DD, and Podcasts tabs (~2200 lines)
- `public/acq.js` — Acquisitions tab only; self-contained with embedded data and SVG chart rendering; no server calls
- `public/styles.css` — all styles
- `public/index.html` — single HTML file; all tab content lives here
- `data.json` — sole persistence layer (tasks, columns, companies, podcasts)

**Single data file:** All state is stored in `data.json`. `server.js` reads on every request via `loadData()` and writes on every mutation via `saveData()`. No database.

**Frontend state pattern (`public/app.js`):** A single global `data` object mirrors the server state. Mutations follow this flow:
1. Call `saveStateForUndo()` to snapshot `data` before the change
2. Optimistically update `data` in memory
3. Fire the relevant `fetch()` API call to persist
4. Call `renderBoard()` (or the relevant render function) to re-render from scratch

Undo works by storing deep-cloned snapshots of `data` in `undoStack` (max 20), then restoring via `PUT /api/data`.

**IDs:** All records use `Date.now().toString()` as their primary key.

**Tabs and rendering:** Each tab (Board, HubSpot, DD, Podcasts, Acquisitions) has its own render functions. Tabs are shown/hidden by toggling a `hidden` class — not separate pages. Tab switch triggers `loadHubspot()`, `loadDD()`, `loadPodcasts()`, or `initAcqTab()` on first activation.

**Theming:** CSS custom properties defined in `:root` (dark, default). Additional themes applied by adding a class to `body` (`theme-light`, `theme-ocean`, `theme-forest`, `theme-sunset`). Persisted in `localStorage` under key `theme`. The legacy `light-mode` class still works for backwards compatibility.

**Claude API calls:** Two separate functions in `server.js`:
- `callClaude(prompt)` — text-only, used for podcast episode analysis
- `callClaudeWithContent(contentArray)` — multimodal content array, used for DD document analysis (supports native PDF via base64 `document` block)

Both make raw HTTPS requests to `api.anthropic.com` — no Anthropic SDK. Model: `claude-sonnet-4-6`.

**YouTube import (Podcasts tab):** Uses Server-Sent Events (`GET /api/podcasts/import-youtube`). Flow: resolve channel ID → fetch RSS feed → scrape auto-captions via `timedtext` API → call Claude to extract investment ideas as structured JSON. Progress events stream to client in real time.

**DD tab document analysis:** `POST /api/dd/analyze-document` accepts file upload via `multer`. PDFs use Claude's native document support; DOCX uses `mammoth`; Excel uses `xlsx` (all sheets converted to CSV). Response is structured JSON with financials, customer metrics, and balance sheet extracted by Claude using `DD_ANALYSIS_PROMPT` (defined inline in `server.js`).

**HubSpot integration:** All HubSpot API calls proxied through server using `HUBSPOT_API_KEY`. Key endpoints:
- `GET /api/hubspot/funnel` — aggregate + per-owner funnel with period filters (`week/month/ytd/year`) and `view=historical|current`. Historical mode uses `hs_v2_date_entered_<stageId>` properties to count deals that have ever reached each stage. Stages after the first `isClosed=true` stage are treated as "parked" (side-track).
- `GET /api/hubspot/funnel/deals` — deal drilldown for a clicked funnel stage row
- `GET /api/hubspot/owner-funnel` — per-owner deal breakdown

**Acquisitions tab (`public/acq.js`):** Entirely self-contained. Data is hardcoded/embedded in the file — no API calls. Renders three sub-panels (Quotes, Financials, Sales Orders) with SVG charts built manually using `document.createElementNS`. Initialises once on first tab activation via `initAcqTab()` guard flag.

**File uploads:** `multer` with memory storage, 20 MB limit. Supported: PDF, DOCX, XLSX/XLS, plain text.

## Environment

Required `.env` variables:
- `HUBSPOT_API_KEY` — HubSpot private app token
- `ANTHROPIC_API_KEY` — Anthropic API key (podcast analysis + DD document analysis)

## Git workflow

After every change: commit with a descriptive message and push to `origin main`.
Remote: `https://github.com/rohens13/todo-board`
