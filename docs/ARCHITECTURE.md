# Architecture

## Runtime boundaries

Visitors submit one company name. `src/client.js` calls the owner-configured discovery API; `server/discovery.js` executes three concurrent searches against Brave or an owned SearXNG service, filters observations mentioning the company, deduplicates profiles and returns sourced candidates. The browser validates the graph and renders inferred lines automatically. No manual-research dialog or visitor connection settings are present.

GitHub Pages serves the frontend only. The API is a separate Node or Worker deployment. An empty owner connection configuration is an explicit unavailable state, not a completed live discovery deployment.

- `src/app.js`: graph UI, local persistence and optional editing/import/export.
- `src/client.js`: deployment connection validation and bounded automatic-discovery request.
- `src/model.js`: safe normalized schema, validation, layout and inferred reporting suggestions.
- `server/discovery.js`: company validation, three search queries, normalization, deduplication, company mention filtering and partial-failure warnings.
- `server/index.js`, `server/worker.js`: HTTP adapters, allowlisted CORS, rate limits and 15-minute cache.
- `src/research.js`: legacy paste parser retained for compatibility and tests; not imported or shipped by the active frontend.
- `scripts/build.js`: frontend-only content-hashed assets; credentials and server code excluded.

## Evidence model

`linkedin` and `excerpt` identify the source observation. Search results are candidate profiles; employer membership and title accuracy are not certified. `observedAt` records retrieval time, not source publication time.

`managerId` is a stored user-supplied reporting link. `relationship` is `inferred` or `confirmed`; confirmed links require an evidence note. Confirmation is the user's claim and is not independently audited. Title-based suggestions are shown by default as a display-only copy and never overwrite source data or exported JSON.

Suggestions require a unique candidate at the closest more senior title tier in the same department, or a unique top executive fallback. They are still guesses. Ambiguous candidates produce no link. Title parsing is English heuristic logic and should be reviewed for multilingual or unusual titles.

## Known limits

- Three concurrent queries return at most 60 Brave or 150 SearXNG observations before deduplication. No pagination or complete employee census is claimed.
- Result titles may contain company names or outdated positions. Display retains text rather than using a model to hallucinate missing information.
- Initial graph placement reflects title tier rather than a verified org chart.
- Layout is deterministic by level, department and name; it is not an optimal edge-crossing algorithm.
- User graph editing and import are bounded to 500 people. Large charts need filters and zoom.
- Data lives in browser localStorage, not a shared company database. JSON export is the backup and transfer mechanism.
- No analytics or third-party profile photos are loaded. Google Fonts is used for typography, with a sans-serif fallback.
- CORS and IP limits are not user authentication. For broad distribution, add authentication, account quotas, persistent shared rate limiting and monitoring.

## Extension points

Additional search providers should return the existing normalized graph shape and include excerpts and retrieval dates. Keep provider secrets exclusively in backend environment variables. An authorized LinkedIn data provider can replace Brave without changing the graph view. Never convert profile membership into confirmed reporting relationships automatically.

## Configuration ownership

Only the owner sets the server search provider and the public API origin. No provider key or auth cookie is accepted by the frontend. Browser-local backend overrides from the legacy assisted workflow are ignored. Localhost uses the same-origin development server; production requires explicit configuration. Search failure preserves the previous chart and displays an error instead of starting manual work.
