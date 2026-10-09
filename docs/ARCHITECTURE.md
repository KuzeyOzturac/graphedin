# Architecture

## Runtime boundaries

By default the frontend opens company-specific public searches, receives user-pasted clipboard content, previews profile candidates and builds the graph locally. No remote content scraping, API key or backend is involved. The optional automatic mode calls a separately hosted `/api/discover?company=...` API. That backend queries a self-hosted SearXNG instance or Brave for LinkedIn profile search results, normalizes those results, and returns a graph without reporting links. The browser validates the response, renders it, and saves user edits locally.

- `index.html`, `src/style.css`: responsive workspace, dialogs and accessible controls.
- `src/app.js`: browser state, SVG drawing, navigation, filtering, editing, import/export, and API client.
- `src/research.js`: safe search links, plain/rich clipboard parsing, spreadsheet support, selection and deduplicated merges.
- `src/model.js`: shared normalized schema, LinkedIn URL checks, validation, title tiers, optional inferred-manager suggestions, and graph layout.
- `server/discovery.js`: company input validation, Brave request, result parser, source excerpts and timestamps.
- `server/index.js`: Node HTTP adapter, CORS allowlist, rate limiting, bounded cache and local static development server.
- `server/worker.js`: optional Worker API adapter, platform rate limiter and edge cache.
- `scripts/build.js`: copies only frontend files into `dist/`.
- `.github/workflows/pages.yml`: syntax checks, tests, static build and Pages deployment.

## Evidence model

`linkedin` and `excerpt` identify the source observation. Search results are candidate profiles; employer membership and title accuracy are not certified. `observedAt` records retrieval time, not source publication time.

`managerId` is a stored user-supplied reporting link. `relationship` is `inferred` or `confirmed`; confirmed links require an evidence note. Confirmation is the user's claim and is not independently audited. Title-based suggestions are a display-only copy and never overwrite source data or exported JSON.

Suggestions require a unique candidate at the closest more senior title tier in the same department, or a unique top executive fallback. They are still guesses. Ambiguous candidates produce no link. Title parsing is English heuristic logic and should be reviewed for multilingual or unusual titles.

## Known limits

- Optional Brave search is bounded to 20 profile results per request; SearXNG is bounded to 50. Clipboard imports support up to 500 people. No pagination or complete employee census is claimed.
- Result titles may contain company names or outdated positions. Display retains text rather than using a model to hallucinate missing information.
- Initial graph placement reflects title tier rather than a verified org chart.
- Layout is deterministic by level, department and name; it is not an optimal edge-crossing algorithm.
- User graph editing and import are bounded to 500 people. Large charts need filters and zoom.
- Data lives in browser localStorage, not a shared company database. JSON export is the backup and transfer mechanism.
- No analytics or third-party profile photos are loaded. Google Fonts is used for typography, with a sans-serif fallback.
- CORS and IP limits are not user authentication. For broad distribution, add authentication, account quotas, persistent shared rate limiting and monitoring.

## Extension points

Additional search providers should return the existing normalized graph shape and include excerpts and retrieval dates. Keep provider secrets exclusively in backend environment variables. An authorized LinkedIn data provider can replace Brave without changing the graph view. Never convert profile membership into confirmed reporting relationships automatically.

## Keyless research boundary

The app cannot read another browser tab. A user initiates external search and explicitly pastes content into GraphEdIn. Rich clipboard HTML is used only to extract names and safe profile URLs; it is never inserted into the page. No script is executed and no pasted links are fetched automatically. Preview checkbox selections determine which people are imported. Pasting is a local operation; no clipboard-reading permission is requested.
