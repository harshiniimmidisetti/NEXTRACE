# NEXTRACE
Every Clue Matters. Every Evidence Counts.
AI-assisted digital forensics demo: four agents (SCOUT, VERITY, CIPHER, CHRONICLE), evidence hashing, relationship graph, timeline, case assistant and PDF report.

## Project layout
```
frontend/
  index.html            page shell (loads styles/ and dist/app.js)
  config.js             runtime config (apiUrl; empty = DEMO MODE)
  styles/               main.css, workspace.css, nexa.css, utilities.css
  src/                  TypeScript (strict), compiled to frontend/dist/
    types.ts            shared domain types
    core/               DOM-free logic: hash, VERITY, CIPHER, graph, timeline, ledger, assistant
    state/              typed store + activity/ledger recording
    services/           agent actions, NEXA chat, voice, ledger, PDF report
    components/         HTML render functions (workspace tabs, NEXA chat, badges, icons)
    pages/              landing, login, dashboard + demo data
    ui/                 DOM wiring (re-render hook, delegated events)
    app.ts              router and sign-in
  tests/                node:test suites (core, assistant, full workspace flow)
backend/
  app/
    main.py             app factory
    config.py           settings from environment
    database.py models.py schemas.py passwords.py security.py audit.py
    routers/            auth, cases, evidence, audit, assistant (NEXA)
    forensics.py        pure integrity helpers
    nexa.py             Claude integration helpers (pure, mockable)
  tests/                unittest suites
```

## Develop
```
npm install          # typescript, prettier, @types/node
npm run build        # tsc -> frontend/dist (committed, so static hosts need no build step)
npm start            # build + serve ./frontend at http://localhost:8080
npm run typecheck    # strict type check of src and tests
npm run format       # prettier (npm run format:check to verify)
```
## Run tests
```
npm test             # TypeScript tests (node:test) + Python tests (unittest)
```
## Run the backend (optional, not wired to the UI yet)
```
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env     # set JWT_SECRET (32+ chars)
python seed.py           # creates demo accounts
uvicorn app.main:app --reload
```
API docs appear at http://localhost:8000/docs. Endpoints: `POST /api/auth/login`, `GET/POST /api/cases`, `PATCH /api/cases/{id}/assign`, `POST /api/cases/{id}/evidence`, `POST /api/evidence/{id}/verify`, `GET /api/audit` (admin), `GET /api/ledger/verify`, `POST /api/nexa/chat`, `GET /api/health`.

## PostgreSQL
`docker compose up db`, then in `.env`: `DATABASE_URL=postgresql+psycopg2://nextrace:change_me_locally@localhost:5432/nextrace`. Default is SQLite so the backend starts without a database server.

## Claude API (optional)
See the NEXA section below.

## Deploy
- Netlify: `netlify.toml` publishes `frontend/` with no build command (`frontend/dist` is committed; run `npm run build` after changing `src/`).
- Vercel: `vercel.json` serves `frontend/` (same note). Host the FastAPI backend elsewhere (Render, Railway, Docker).
- Mandatory env vars: none for the demo UI; `JWT_SECRET` for the backend.

## Demo accounts (password for all: `Demo@12345`)
| Role | Email |
|---|---|
| Police Officer | officer@demo.nextrace |
| Digital Forensic Investigator | investigator@demo.nextrace |
| Administrator | admin@demo.nextrace |

All data is synthetic DEMO DATA. Do not enter real police, Aadhaar or PAN details.

## What works (tested) and what does not
Tested here: strict TypeScript build, 30 frontend tests (core logic, assistant, full workspace flow with a fake DOM), a real-Chromium click-through (sign in, run all agents, findings, graph, NEXA, ledger) with no console errors, and 17 Python unit tests (hashing, ledger chain, NEXA helpers, passwords, settings).
NOT tested here (sandbox had no network or FastAPI): `npm`/`pip` installs, the running FastAPI server and its routers (only import-checked with stubs), PostgreSQL, live Netlify/Vercel deployment, jsPDF download. Test these before presenting.
Not built: React/Vite (the frontend is dependency-free TypeScript compiled with `tsc`), Alembic migrations, user-management and audit-log pages in the UI, live PhishTank/OpenPhish/CIC-IDS2017 integrations, wiring case creation and evidence upload in the UI to the backend API.

## New in this update
- **ARCHIVE agent (5th agent)**: keeps the case records as a tamper-evident ledger (each entry contains the SHA-256 of the previous one). Records tab: verify ledger, simulate tampering (on a copy), export JSON, case record index.
- **Data from another source**: Assistant > "Send data from another source to ARCHIVE" (or Attach file). ARCHIVE files it, SCOUT imports it, VERITY verifies it, then the assistant can answer about it. Sample: `docs/SAMPLE_EXTERNAL_DATA.txt`. New data must be reviewed by the investigator ("Review and analyze now") before CIPHER includes it, and any approved report is reset to draft.
- **Assistant**: answers only from case data with evidence IDs. Handles: summary, suspicious activity, what happened first, failed evidence, "tell me about EV-0003", "where is <IP>", IPs, domains, counts, custody records. Quick-question buttons.
- **Voice**: Mic button (speech to text) and "Voice replies" (text to speech) use the browser's speech features. English (en-IN). Works in Chrome/Edge only; not tested in a real browser here.
- Backend: ledger is hash-chained in the database; `GET /api/ledger/verify`.


## NEXA: NEXTRACE AI Investigation Assistant
Floating NEXA button (bottom right, after sign-in) opens a chat panel; "Full page" or the **NEXA assistant** tab opens the full-page version.
- **Works with all agents:** answers carry a "via SCOUT / VERITY / CIPHER / CHRONICLE / ARCHIVE" tag, and you can tell NEXA to act: "Run SCOUT", "Run VERITY", "Run CIPHER" (needs the investigator review step first), "Generate the report".
- **Answers only from the case:** explains findings and verification results, relationships, timeline, drafts a summary, recommends extra evidence to collect, and cites evidence IDs (clickable chips). It never invents evidence, timestamps or findings; unknown questions get a "not in the case data" reply.
- **Chat features:** conversation history, typing indicator, suggested questions, disabled Send while loading, error bubble with Retry, voice input/output (Chrome/Edge, English).
- **Demo assistant (default):** no key needed; clearly labelled "Demo assistant (synthetic data)". Used whenever `config.js` has an empty `apiUrl` or the server has no Claude key.
- **Claude mode (backend only):** the key stays on the server.
  1. `backend/.env`: set `ANTHROPIC_API_KEY` (from console.anthropic.com; API usage is billed separately from claude.ai plans), `JWT_SECRET`, `CORS_ORIGINS` (your frontend URL), optional `NEXA_MODEL`, `NEXA_MAX_TOKENS` (default 800), `NEXA_DAILY_LIMIT` (default 50 questions per user per day).
  2. `python seed.py`, then `uvicorn app.main:app`.
  3. In the frontend `config.js` set `apiUrl` to the backend URL, sign in with a demo account (now checked by the backend).
  4. Create a case and upload evidence through the API docs page (`/docs`: `POST /api/cases`, `POST /api/cases/{id}/evidence`; admin assigns an investigator with `PATCH /api/cases/{id}/assign`). Cases you may access then appear in NEXA's case selector.
- **Access control:** `POST /api/nexa/chat` returns 404 for cases the user cannot access (admin: all, police: own cases, investigator: assigned cases). Only that case's evidence is sent to Claude, as untrusted data, and any evidence ID in the answer that is not in the case is flagged.
- **Limits you should know:** the Claude path is covered by unit tests with a mocked API, not a live call. The backend knows evidence records, verification status, extracted indicators and timestamps; CIPHER findings and the graph are not stored server-side yet. The web UI does not yet create cases in the backend.
